from typing import Dict, Any, Optional

class StateManager:
    """
    Manages conversational state across interactions, allowing for multi-step 
    flows (e.g., asking for a remote URL before pushing).
    """
    
    def __init__(self):
        # In a real app, state would be keyed by a session or user ID
        # and stored in a database or Redis.
        self.state = "idle"
        self.context: Dict[str, Any] = {}
        
    def get_state(self) -> str:
        return self.state
        
    def set_state(self, new_state: str):
        self.state = new_state
        
    def update_context(self, key: str, value: Any):
        self.context[key] = value
        
    def get_context(self, key: str) -> Optional[Any]:
        return self.context.get(key)
        
    def clear_context(self):
        self.context = {}
        self.state = "idle"

# Singleton pattern for simplicity in this prototype.
# In production, use dependency injection per request.
global_state_manager = StateManager()
