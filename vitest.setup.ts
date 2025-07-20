import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { MockBroadcastChannel } from './packages/core/src/__mocks__/mockBroadcastChannel'

vi.stubGlobal('BroadcastChannel', MockBroadcastChannel)
