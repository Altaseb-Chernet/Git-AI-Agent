import re
import json
from typing import Dict, Any

class AIParser:
    \"\"\"
    Parses natural language input to determine the Git intent.
    Currently uses heuristic Regex rules. Designed to be easily 
    swappable with an LLM call (e.g., OpenAI, Gemini, Claude).
    \"\"\"

    def __init__(self):
        # Dictionary of heuristic rules mapping patterns to intents
        self.rules = {
            r"\\b(upload|sync|save|push)\\b": "sync_push",
            r"\\bstatus|what changed\\b": "status",
            r"\\bcheckout\\s+(.+)|switch to\\s+(.+)\\b": "checkout",
            r"\\bnew branch\\s+(.+)|create branch\\s+(.+)\\b": "new_branch",
            r"\\bcommit\\b": "commit",
            r"\\bundo|oops|revert\\b": "undo_soft",
            r"\\bstash\\b": "stash"
        }

    def parse_intent(self, text: str) -> Dict[str, Any]:
        \"\"\"
        Analyzes the text and returns a structured intent object.
        \"\"\"
        text_lower = text.lower()
        
        for pattern_str, action in self.rules.items():
            match = re.search(pattern_str, text_lower)
            if match:
                # Extract branch names if captured
                args = {}
                if action in ("checkout", "new_branch"):
                    # Extract the first non-None group
                    branch_name = next((g for g in match.groups() if g), "unknown")
                    args["branch_name"] = branch_name.strip()

                return {
                    "action": action,
                    "confidence": 0.8,
                    "args": args,
                    "raw_input": text
                }
                
        # Fallback if no specific intent is found
        return {
            "action": "unknown",
            "confidence": 0.1,
            "args": {},
            "raw_input": text
        }
    
    def generate_commit_message(self, diff_text: str) -> str:
        \"\"\"
        Given git diff output, generate a meaningful commit message.
        Placeholder for LLM integration. For now, generates basic heuristics.
        \"\"\"
        if not diff_text:
            return "WIP: Snapshot commit"
            
        return "Update files based on natural language command"
