/**
 * ApiKeyStep Component
 *
 * First step of the setup wizard: API key input and validation.
 */

import { useState } from 'react'
import { isValidApiKey } from '@/utils/validation'

export interface ApiKeyStepProps {
  onConnect: (apiKey: string) => Promise<boolean>
  isConnecting: boolean
  connectionError: string | null
}

export function ApiKeyStep({ onConnect, isConnecting, connectionError }: ApiKeyStepProps) {
  const [apiKey, setApiKey] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const trimmedKey = apiKey.trim()

    if (!isValidApiKey(trimmedKey)) {
      setValidationError('Invalid API key format. Please enter a valid UUID.')
      return
    }

    await onConnect(trimmedKey)
  }

  const displayError = validationError ?? connectionError

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect to Hevy</h2>
      <p className="text-gray-600 mb-6">
        Enter your Hevy API key to get started. You can find your API key in{' '}
        <a
          href="https://hevy.com/settings?developer"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Hevy Settings → Developer
        </a>
        .
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <input
            id="api-key"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            disabled={isConnecting}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                       focus:ring-blue-500 focus:border-blue-500
                       disabled:bg-gray-100 disabled:cursor-not-allowed"
            autoComplete="off"
          />
        </div>

        {displayError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{displayError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isConnecting || !apiKey.trim()}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md font-medium
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     disabled:bg-gray-400 disabled:cursor-not-allowed
                     min-h-[44px]"
        >
          {isConnecting ? 'Connecting...' : 'Connect'}
        </button>
      </form>

      <p className="mt-4 text-xs text-gray-500">
        Note: Hevy Pro subscription is required for API access. Your API key is stored locally and
        never sent to any server except Hevy.
      </p>
    </div>
  )
}
