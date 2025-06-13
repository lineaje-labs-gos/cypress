export interface GetCodeModalContentsProps {
  code: string
  lineNumber: number
  columnNumber: number
  fileName: string
}

export type GetCodeModalContentsShape = (props: GetCodeModalContentsProps) => JSX.Element

export interface CyPromptAppDefaultShape {
  // Purposefully do not use React in this signature to avoid conflicts when this type gets
  // transferred to the Cypress app
  GetCodeModalContents: GetCodeModalContentsShape
}
