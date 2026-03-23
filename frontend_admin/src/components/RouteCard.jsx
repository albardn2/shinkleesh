import React from 'react'
import { useState, useCallback } from 'react'
import { apiRequest } from '../api'

const METHOD_BADGE = {
  GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  POST: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  PUT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  DELETE: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const STATUS_COLOR = (status) => {
  if (!status) return 'bg-slate-600 text-slate-200'
  if (status >= 200 && status < 300) return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
  if (status >= 400 && status < 500) return 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
  if (status >= 500) return 'bg-red-500/20 text-red-300 border border-red-500/30'
  return 'bg-slate-600/20 text-slate-300 border border-slate-500/30'
}

function JsonValue({ value, depth = 0 }) {
  if (value === null) return <span className="text-slate-500">null</span>
  if (typeof value === 'boolean') return <span className="text-purple-400">{String(value)}</span>
  if (typeof value === 'number') return <span className="text-blue-300">{value}</span>
  if (typeof value === 'string') return <span className="text-green-300">"{value}"</span>
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-slate-400">[]</span>
    return (
      <span>
        <span className="text-slate-400">[</span>
        {value.map((item, i) => (
          <span key={i}>
            <br />
            <span style={{ marginLeft: `${(depth + 1) * 16}px` }}>
              <JsonValue value={item} depth={depth + 1} />
              {i < value.length - 1 && <span className="text-slate-500">,</span>}
            </span>
          </span>
        ))}
        <br />
        <span style={{ marginLeft: `${depth * 16}px` }} className="text-slate-400">]</span>
      </span>
    )
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value)
    if (entries.length === 0) return <span className="text-slate-400">{'{}'}</span>
    return (
      <span>
        <span className="text-slate-400">{'{'}</span>
        {entries.map(([k, v], i) => (
          <span key={k}>
            <br />
            <span style={{ marginLeft: `${(depth + 1) * 16}px` }}>
              <span className="text-slate-300">"{k}"</span>
              <span className="text-slate-500">: </span>
              <JsonValue value={v} depth={depth + 1} />
              {i < entries.length - 1 && <span className="text-slate-500">,</span>}
            </span>
          </span>
        ))}
        <br />
        <span style={{ marginLeft: `${depth * 16}px` }} className="text-slate-400">{'}'}</span>
      </span>
    )
  }
  return <span className="text-slate-300">{String(value)}</span>
}

function ResponsePanel({ response }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const text = typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data, null, 2)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="mt-4 rounded-xl overflow-hidden border border-slate-700/50">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR(response.status)}`}>
            {response.status || 'ERR'}
          </span>
          <span className="text-xs text-slate-500">{response.ms}ms</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors duration-100 flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      {/* Body */}
      <div className="bg-slate-900 px-4 py-4 max-h-80 overflow-auto scrollbar-thin">
        <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-all">
          {typeof response.data === 'string' ? (
            <span className="text-slate-300">{response.data}</span>
          ) : (
            <JsonValue value={response.data} />
          )}
        </pre>
      </div>
    </div>
  )
}

/**
 * Field types:
 * - text (default)
 * - password
 * - email
 * - select: requires options array [{ value, label }]
 * - textarea
 * Query params: pass isQuery: true on a field
 */
export default function RouteCard({
  id,
  method,
  path,
  title,
  description,
  fields = [],
  queryFields = [],
  requiresAuth = false,
  token,
  onTokenReceived,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [values, setValues] = useState({})
  const [queryValues, setQueryValues] = useState({})
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)

  const setValue = (key, val) => setValues(prev => ({ ...prev, [key]: val }))
  const setQueryValue = (key, val) => setQueryValues(prev => ({ ...prev, [key]: val }))

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setLoading(true)
    setResponse(null)

    // Substitute :param placeholders in path from body values
    let resolvedPath = path
    const bodyWithoutPathParams = { ...values }
    const paramMatches = path.match(/:([a-z_]+)/g) || []
    for (const param of paramMatches) {
      const key = param.slice(1) // strip leading ':'
      if (values[key]) {
        resolvedPath = resolvedPath.replace(param, encodeURIComponent(values[key]))
        delete bodyWithoutPathParams[key]
      }
    }

    const result = await apiRequest({
      method,
      path: resolvedPath,
      body: fields.length > 0 ? bodyWithoutPathParams : undefined,
      query: queryFields.length > 0 ? queryValues : undefined,
      token: requiresAuth ? token : undefined,
    })

    setLoading(false)
    setResponse(result)

    // Auto-save token from login response
    if (onTokenReceived && result.data) {
      const data = result.data
      const found = data.token || data.access_token || data.jwt
      if (found) onTokenReceived(found)
    }
  }, [method, path, fields, queryFields, values, queryValues, requiresAuth, token, onTokenReceived])

  const renderField = (field, val, onChange) => {
    const baseInput = "w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-colors duration-150"

    if (field.type === 'select') {
      return (
        <select
          value={val || ''}
          onChange={e => onChange(field.name, e.target.value)}
          className={baseInput}
        >
          {field.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          value={val || ''}
          onChange={e => onChange(field.name, e.target.value)}
          placeholder={field.placeholder || field.name}
          rows={3}
          className={`${baseInput} resize-none`}
        />
      )
    }

    return (
      <input
        type={field.type || 'text'}
        value={val || ''}
        onChange={e => onChange(field.name, e.target.value)}
        placeholder={field.placeholder || field.name}
        className={baseInput}
      />
    )
  }

  return (
    <div
      id={`card-${id}`}
      className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden transition-shadow duration-200 hover:shadow-md"
    >
      {/* Card header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border font-mono flex-shrink-0 ${METHOD_BADGE[method]}`}>
            {method}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
              {requiresAuth && (
                <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </div>
            <p className="text-xs font-mono text-slate-500 truncate mt-0.5">{path}</p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 flex-shrink-0 ml-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible body */}
      {open && (
        <div className="px-5 pb-5 border-t border-slate-100">
          {description && (
            <p className="text-sm text-slate-500 mt-3 mb-4">{description}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Query fields */}
            {queryFields.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Query Params</p>
                {queryFields.map(field => (
                  <div key={field.name}>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {field.label || field.name}
                      {field.optional && <span className="text-slate-400 font-normal ml-1">(optional)</span>}
                    </label>
                    {renderField(field, queryValues[field.name], setQueryValue)}
                  </div>
                ))}
              </div>
            )}

            {/* Body fields */}
            {fields.length > 0 && (
              <div className="space-y-3">
                {queryFields.length > 0 && (
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Body</p>
                )}
                {fields.map(field => (
                  <div key={field.name}>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {field.label || field.name}
                      {field.optional && <span className="text-slate-400 font-normal ml-1">(optional)</span>}
                    </label>
                    {renderField(field, values[field.name], setValue)}
                  </div>
                ))}
              </div>
            )}

            {/* Auth warning */}
            {requiresAuth && !token && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs text-amber-700">No token set — paste one in the sidebar first.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Send Request
                </>
              )}
            </button>
          </form>

          {response && <ResponsePanel response={response} />}
        </div>
      )}
    </div>
  )
}
