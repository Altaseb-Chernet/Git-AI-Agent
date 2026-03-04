from state_model import RepoState
from decision_engine import DecisionEngine

def main():
    state = RepoState()
    state.update()

    state.display()

    engine = DecisionEngine()
    decision = engine.analyze(state)

    print("\nAI Suggestion:")
    print(decision)


if __name__ == "__main__":
    main()