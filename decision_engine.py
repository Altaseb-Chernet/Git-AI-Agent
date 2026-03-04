class DecisionEngine:

    def analyze(self, state):

        if "Untracked files" in state.status:
            return {
                "problem": "Untracked files detected",
                "risk": "Files may not be committed",
                "suggestion": "Run git add . and git commit -m 'Add files'"
            }

        if "both modified" in state.status:
            return {
                "problem": "Merge conflict detected",
                "risk": "Code inconsistency",
                "suggestion": "Open conflicted files and resolve markers"
            }

        return {
            "problem": "No major issue",
            "risk": "Low",
            "suggestion": "Repository is stable"
        }