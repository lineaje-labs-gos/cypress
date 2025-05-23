// Note: This file is owned by the cloud delivered
// cy prompt bundle. It is downloaded and copied here.
// It should not be modified directly here.

/// <reference types="cypress" />

import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping.d'
import type { Router } from 'express'
import type { AxiosInstance } from 'axios'

type Commands = ProtocolMapping.Commands
type Command<T extends keyof Commands> = Commands[T]
type Events = ProtocolMapping.Events
type Event<T extends keyof Events> = Events[T]

interface RetryOptions {
  maxAttempts: number
  retryDelay?: (attempt: number) => number
  shouldRetry?: (err?: unknown) => boolean
  onRetry?: (delay: number, err: unknown) => void
}

export interface CyPromptAuthenticatedUserShape {
  id?: string //Cloud user id
  name?: string
  email?: string
  authToken?: string
}

export interface CyPromptCloudApi {
  cloudUrl: string
  cloudHeaders: Record<string, string>
  CloudRequest: AxiosInstance
  isRetryableError: (err: unknown) => boolean
  asyncRetry: AsyncRetry
}

type AsyncRetry = <TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RetryOptions
) => (...args: TArgs) => Promise<TResult>

export interface CyPromptServerOptions {
  cyPromptHash?: string
  cyPromptPath: string
  projectSlug?: string
  cloudApi: CyPromptCloudApi
  getUser(): Promise<Partial<CyPromptAuthenticatedUserShape>>
  config: Partial<Cypress.RuntimeConfigOptions & Cypress.ResolvedConfigOptions>
}

export interface CyPromptCDPClient {
  send<T extends Extract<keyof Commands, string>>(
    command: T,
    params?: Command<T>['paramsType'][0]
  ): Promise<Command<T>['returnType']>
  on<T extends Extract<keyof Events, string>>(
    eventName: T,
    cb: (event: Event<T>[0]) => void | Promise<unknown>
  ): void
}

export interface CyPromptServerShape {
  initializeRoutes(router: Router): void
  handleBackendRequest: (eventName: string, ...args: any[]) => Promise<any>
  connectToBrowser: (cdpClient: CyPromptCDPClient) => void
}

export interface CyPromptServerDefaultShape {
  createCyPromptServer: (
    options: CyPromptServerOptions
  ) => Promise<CyPromptServerShape>
  MOUNT_VERSION: number
}
