"""
AI-powered transaction categorization using Google Gemini API.

This service provides intelligent categorization for transactions that 
the rule-based system cannot match, using natural language understanding.
"""

import os
import json
import logging
from typing import List, Tuple, Optional, Dict
import google.generativeai as genai

logger = logging.getLogger(__name__)

class AICategorizer:
    """AI-powered transaction categorization using Gemini."""
    
    def __init__(self):
        self.model = None
        self.enabled = False
        self._initialized = False
    
    def _ensure_initialized(self):
        """Lazily initialize the API on first use (after .env is loaded)."""
        if self._initialized:
            return
        
        self._initialized = True
        api_key = os.getenv("GEMINI_API_KEY")
        
        if api_key:
            try:
                genai.configure(api_key=api_key)
                # Use the latest Gemini 3 Flash
                self.model = genai.GenerativeModel('gemini-3-flash-preview')
                self.enabled = True
                logger.info("AI Categorizer initialized successfully with Gemini API")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini API: {e}")
        else:
            logger.info("GEMINI_API_KEY not set - AI categorization disabled")
    
    async def categorize_batch(
        self, 
        transactions: List[Dict], 
        bucket_names: List[str]
    ) -> Dict[int, Tuple[str, float]]:
        """
        Categorize a batch of transactions using AI.
        
        Args:
            transactions: List of dicts with 'id', 'description', 'amount'
            bucket_names: List of user's budget category names
            
        Returns:
            Dict mapping transaction index to (bucket_name, confidence)
        """
        if not self.enabled or not transactions:
            return {}
        
        # Limit batch size to 50 for API efficiency
        batch = transactions[:50]
        
        # Build the prompt
        prompt = self._build_prompt(batch, bucket_names)
        
        try:
            response = await self._call_gemini(prompt)
            return self._parse_response(response, len(batch), bucket_names)
        except Exception as e:
            logger.error(f"AI categorization failed: {e}")
            return {}
    
    def categorize_batch_sync(
        self, 
        transactions: List[Dict], 
        bucket_names: List[str],
        progress_callback=None  # Optional: progress_callback(processed_count, total_count, batch_num)
    ) -> Dict[int, Tuple[str, float]]:
        """Synchronous version that processes ALL transactions in parallel batches."""
        from concurrent.futures import ThreadPoolExecutor, as_completed
        import threading
        
        self._ensure_initialized()
        
        if not self.enabled or not transactions:
            logger.info(f"AI categorization skipped: enabled={self.enabled}, txn_count={len(transactions)}")
            return {}
        
        total_count = len(transactions)
        batch_size = 10  # Small batches to prevent Gemini response truncation
        num_batches = (total_count + batch_size - 1) // batch_size
        
        logger.info(f"AI categorizing {total_count} transactions across {num_batches} batches (parallel)")
        
        all_results = {}
        results_lock = threading.Lock()
        completed_batches = [0]  # Use list to allow mutation in nested function
        
        def process_single_batch(batch_start: int) -> Dict[int, Tuple[str, float]]:
            """Process a single batch and return results with global indices."""
            batch = transactions[batch_start:batch_start + batch_size]
            batch_num = batch_start // batch_size + 1
            prompt = self._build_prompt(batch, bucket_names)
            batch_results = {}
            
            try:
                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        max_output_tokens=4096,
                        temperature=0.1,
                    ),
                    request_options={"timeout": 45}
                )
                parsed = self._parse_response(response.text, len(batch), bucket_names)
                
                # Map local indices to global indices
                for local_idx, (bucket, conf) in parsed.items():
                    batch_results[batch_start + local_idx] = (bucket, conf)
                
                with results_lock:
                    with open("ai_debug.log", "a") as f:
                        f.write(f"Batch {batch_num}/{num_batches}: {len(parsed)}/{len(batch)} matched\n")
                        
                logger.info(f"Batch {batch_num}/{num_batches}: {len(parsed)}/{len(batch)} matched")
                
            except Exception as e:
                with results_lock:
                    with open("ai_debug.log", "a") as f:
                        f.write(f"Batch {batch_num}/{num_batches} FAILED: {e}\n")
                logger.error(f"AI batch {batch_num}/{num_batches} failed: {e}")
            
            return batch_results
        
        # Process batches in parallel with 5 concurrent workers
        batch_starts = list(range(0, total_count, batch_size))
        
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {executor.submit(process_single_batch, bs): bs for bs in batch_starts}
            
            for future in as_completed(futures):
                batch_start = futures[future]
                try:
                    batch_results = future.result()
                    with results_lock:
                        all_results.update(batch_results)
                        completed_batches[0] += 1
                        
                    # Report progress
                    if progress_callback:
                        progress_callback(
                            min(completed_batches[0] * batch_size, total_count),
                            total_count,
                            completed_batches[0],
                            num_batches
                        )
                except Exception as e:
                    logger.error(f"Batch future failed: {e}")
        
        logger.info(f"AI total: categorized {len(all_results)}/{total_count} transactions")
        return all_results
    
    def _build_prompt(self, transactions: List[Dict], bucket_names: List[str]) -> str:
        """Build the categorization prompt for Gemini."""
        
        # Format transactions for the prompt
        txn_list = []
        for i, txn in enumerate(transactions):
            desc = txn.get('description', txn.get('raw_description', ''))
            amount = txn.get('amount', 0)
            txn_list.append(f"{i}. \"{desc}\" (${abs(amount):.2f})")
        
        txn_text = "\n".join(txn_list)
        # Format buckets as a numbered list for clarity
        buckets_list = "\n".join([f"- {name}" for name in bucket_names])
        
        prompt = f"""You are a financial transaction categorizer. 

## CRITICAL: You MUST use ONLY these exact category names:
{buckets_list}

## Rules:
1. For each transaction, choose the BEST MATCHING category from the list above
2. You MUST use the EXACT category name as written above - copy it exactly
3. DO NOT create new categories or modify the names
4. If nothing fits, use "Uncategorized" (but try to find a match first)

## Transactions to categorize:
{txn_text}

## Response format (JSON array only, no other text):
[
  {{"index": 0, "category": "EXACT_CATEGORY_NAME", "confidence": 0.9}},
  {{"index": 1, "category": "EXACT_CATEGORY_NAME", "confidence": 0.8}}
]

IMPORTANT: The category field MUST be copied exactly from the list above. Do not paraphrase.

JSON:"""
        
        return prompt
    
    async def _call_gemini(self, prompt: str) -> str:
        """Call Gemini API asynchronously."""
        response = await self.model.generate_content_async(prompt)
        return response.text
    
    def _parse_response(
        self, 
        response_text: str, 
        batch_size: int,
        bucket_names: List[str]
    ) -> Dict[int, Tuple[str, float]]:
        """Parse Gemini's JSON response into categorization results."""
        
        results = {}
        
        # Clean up response - extract JSON if wrapped in markdown
        text = response_text.strip()
        if text.startswith("```"):
            # Remove markdown code blocks
            lines = text.split("\n")
            text = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
        
        # Log raw response BEFORE parsing
        with open("ai_debug.log", "a") as f:
            f.write(f"\n--- Raw AI Response ---\n{response_text[:800]}\n---\n")
        
        try:
            predictions = json.loads(text)
            
            # Log parsed count
            with open("ai_debug.log", "a") as f:
                f.write(f"Parsed {len(predictions)} predictions\n")
            
            # Validate bucket names (case-insensitive matching)
            bucket_lookup = {b.lower(): b for b in bucket_names}
            
            unmatched_categories = []  # Track what AI returns that doesn't match
            
            for pred in predictions:
                idx = pred.get("index")
                category = pred.get("category", "")
                confidence = pred.get("confidence", 0.7)
                
                if idx is not None and 0 <= idx < batch_size:
                    # Match category to user's bucket (case-insensitive)
                    matched_bucket = bucket_lookup.get(category.lower())
                    
                    if matched_bucket:
                        results[idx] = (matched_bucket, min(confidence, 0.85))
                    else:
                        # Track unmatched for debugging
                        unmatched_categories.append(category)
            
            # Log unmatched categories for debugging
            if unmatched_categories:
                unique_unmatched = list(set(unmatched_categories))
                print(f"[AI DEBUG] Unmatched categories ({len(unmatched_categories)} total): {unique_unmatched[:10]}")
                print(f"[AI DEBUG] User's buckets: {bucket_names}")
                # Also write to file for debugging
                with open("ai_debug.log", "a") as f:
                    f.write(f"\n=== AI Batch Debug ===\n")
                    f.write(f"Unmatched categories ({len(unmatched_categories)} total): {unique_unmatched}\n")
                    f.write(f"User's buckets: {bucket_names}\n")
                    
        except json.JSONDecodeError as e:
            # Log to file for debugging
            with open("ai_debug.log", "a") as f:
                f.write(f"JSON PARSE ERROR: {e}\n")
                f.write(f"Text attempted to parse: {text[:500]}...\n")
            logger.warning(f"Failed to parse AI response as JSON: {e}")
        
        return results


# Singleton instance for reuse
_ai_categorizer = None

def get_ai_categorizer() -> AICategorizer:
    """Get or create the AI categorizer singleton."""
    global _ai_categorizer
    if _ai_categorizer is None:
        _ai_categorizer = AICategorizer()
    return _ai_categorizer
