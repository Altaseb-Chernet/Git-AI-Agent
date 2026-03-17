import re
import json
from typing import Dict, Any

class AIParser:
    """
    Parses natural language input to determine the Git intent.
    Currently uses heuristic Regex rules. Designed to be easily 
    swappable with an LLM call (e.g., OpenAI, Gemini, Claude).
    """

    def __init__(self):
        # Dictionary of heuristic rules mapping patterns to intents
        self.rules = {
            r"\b(upload|sync|save|push|publish|send)\b": "sync_push",
            r"\b(status|what changed|what am i doing|changes|check)\b": "status",
            r"\b(checkout|switch to|go to|move to)\s+(.+)\b": "checkout",
            r"\b(new branch|create branch|make branch|add branch)\s+(.+)\b": "new_branch",
            r"\b(list branches|show branches|branches)\b": "branch_list",
            r"\b(pull|sync from remote|update from remote)\b": "pull",
            r"\b(fetch|fetch remote)\b": "fetch",
            r"\b(merge)\s+(.+)\b": "merge",
            r"\b(rebase)\s+(onto\s+)?(.+)\b": "rebase",
            r"\b(cherry[- ]pick)\s+([0-9a-f]{6,40})\b": "cherry_pick",
            r"\b(abort rebase)\b": "rebase_abort",
            r"\b(abort cherry[- ]pick)\b": "cherry_pick_abort",
            r"\b(commit|record|log changes)\b": "commit",
            r"\b(undo|oops|revert|reset|back)\b": "undo_soft",
            r"\b(stash|save for later|store)\b": "stash"
        }

    def parse_intent(self, text: str) -> Dict[str, Any]:
        """
        Analyzes the text and returns a structured intent object.
        """
        text_lower = text.lower()
        
        for pattern_str, action in self.rules.items():
            match = re.search(pattern_str, text_lower)
            if match:
                # Extract branch names if captured
                args = {}
                if action in ("checkout", "new_branch", "merge"):
                    # Extract the first non-None group
                    branch_name = next((g for g in match.groups() if g), "unknown")
                    args["branch_name"] = branch_name.strip()
                elif action == "rebase":
                    # groups: optional "onto " then target
                    target = next((g for g in reversed(match.groups()) if g), "unknown")
                    args["onto"] = target.strip()
                elif action == "cherry_pick":
                    commit_hash = next((g for g in match.groups() if g and re.fullmatch(r"[0-9a-f]{6,40}", g)), "unknown")
                    args["commit"] = commit_hash.strip()

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
        """
        Given git diff output, generate a meaningful commit message.
        Placeholder for LLM integration. For now, generates basic heuristics.
        """
        if not diff_text:
            return "WIP: Snapshot commit"
            
        return "Update files based on natural language command"
