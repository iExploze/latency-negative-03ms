import type { PhaseId } from './PhaseManager'

export type DialogueChoiceId = 'not_copying' | 'who' | 'end'

export type DialogueChoice = {
  id: DialogueChoiceId
  label: string
  response: string
}

export type DialogueSnapshot = {
  active: boolean
  lineId: string
  lineIndex: number
  text: string
  choices: DialogueChoice[]
  selectedChoiceId: DialogueChoiceId | null
}

const EMPTY_DIALOGUE: DialogueSnapshot = {
  active: false,
  lineId: 'none',
  lineIndex: -1,
  text: '',
  choices: [],
  selectedChoiceId: null,
}

const CHOICES: DialogueChoice[] = [
  {
    id: 'not_copying',
    label: 'I am not copying you.',
    response: 'Then why do you only move after I do?',
  },
  {
    id: 'who',
    label: 'Who are you?',
    response: 'I was first.',
  },
  {
    id: 'end',
    label: 'End test.',
    response: 'Both subjects cannot leave.',
  },
]

export class DialogueManager {
  private selectedChoice: DialogueChoice | null = null
  private selectedAtMs = 0
  private wasDialoguePhase = false

  public update(phaseId: PhaseId, phaseElapsedMs: number): DialogueSnapshot {
    if (phaseId !== 'reflectionDialogue') {
      this.reset()
      return EMPTY_DIALOGUE
    }

    if (!this.wasDialoguePhase) {
      this.wasDialoguePhase = true
      this.selectedChoice = null
      this.selectedAtMs = 0
    }

    if (this.selectedChoice) {
      return this.getPostChoiceSnapshot(phaseElapsedMs)
    }

    if (phaseElapsedMs >= 22_000) {
      return {
        active: true,
        lineId: 'why_copying',
        lineIndex: 2,
        text: 'Why are you copying me?',
        choices: CHOICES,
        selectedChoiceId: null,
      }
    }

    if (phaseElapsedMs >= 10_000) {
      return {
        active: true,
        lineId: 'always_late',
        lineIndex: 1,
        text: 'You always move late.',
        choices: [],
        selectedChoiceId: null,
      }
    }

    return {
      active: true,
      lineId: 'moved_late',
      lineIndex: 0,
      text: 'You moved late.',
      choices: [],
      selectedChoiceId: null,
    }
  }

  public selectChoice(choiceId: string, timestampMs: number): void {
    if (this.selectedChoice) {
      return
    }

    const choice = CHOICES.find((candidate) => candidate.id === choiceId)

    if (!choice) {
      return
    }

    this.selectedChoice = choice
    this.selectedAtMs = timestampMs
  }

  public reset(): void {
    this.selectedChoice = null
    this.selectedAtMs = 0
    this.wasDialoguePhase = false
  }

  private getPostChoiceSnapshot(phaseElapsedMs: number): DialogueSnapshot {
    if (!this.selectedChoice) {
      return EMPTY_DIALOGUE
    }

    const elapsedSinceChoice = Math.max(0, phaseElapsedMs - this.selectedAtMs)

    if (elapsedSinceChoice >= 18_000) {
      return {
        active: true,
        lineId: 'stay_there',
        lineIndex: 6,
        text: 'Stay there.',
        choices: [],
        selectedChoiceId: this.selectedChoice.id,
      }
    }

    if (elapsedSinceChoice >= 11_000) {
      return {
        active: true,
        lineId: 'know_how',
        lineIndex: 5,
        text: 'I know how to do it now.',
        choices: [],
        selectedChoiceId: this.selectedChoice.id,
      }
    }

    if (elapsedSinceChoice >= 5_500) {
      return {
        active: true,
        lineId: 'remain_visible',
        lineIndex: 4,
        text: 'Please remain visible.',
        choices: [],
        selectedChoiceId: this.selectedChoice.id,
      }
    }

    return {
      active: true,
      lineId: `response_${this.selectedChoice.id}`,
      lineIndex: 3,
      text: this.selectedChoice.response,
      choices: [],
      selectedChoiceId: this.selectedChoice.id,
    }
  }
}
