import { defineStore } from 'pinia'

// TODO: Share this
interface PromptInfo {
  text: string
  invocationDetails: {
    absoluteFilePath: string
    line: number
    column: number
  }
}

interface PromptState {
  getCodeModalIsOpen: boolean
  currentPromptInfo: PromptInfo | null
}

export const usePromptStore = defineStore('prompt', {
  state: (): PromptState => {
    return {
      getCodeModalIsOpen: false,
      currentPromptInfo: null,
    }
  },
  actions: {
    openGetCodeModal () {
      this.getCodeModalIsOpen = true
    },

    closeGetCodeModal () {
      this.getCodeModalIsOpen = false
    },

    setCurrentPromptInfo (promptInfo: PromptInfo) {
      this.currentPromptInfo = promptInfo
    },
  },
})
