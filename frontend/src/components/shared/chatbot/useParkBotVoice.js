'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition
}

export function cleanForSpeech(text) {
  if (!text) return ''
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_`[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Web Speech API: dictation + optional voice conversation (listen → reply TTS → listen).
 */
export function useParkBotVoice({ voiceLang = 'en-US', onFinalTranscript } = {}) {
  const [SpeechRecognitionCtor] = useState(() => getSpeechRecognition())
  const speechSupported =
    typeof window !== 'undefined' && !!SpeechRecognitionCtor

  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [interim, setInterim] = useState('')

  const voiceLangRef = useRef(voiceLang)
  voiceLangRef.current = voiceLang

  const recognitionRef = useRef(null)
  const onFinalRef = useRef(onFinalTranscript)
  onFinalRef.current = onFinalTranscript

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop?.()
    } catch {
      /* ignore */
    }
    recognitionRef.current = null
    setListening(false)
    setInterim('')
  }, [])

  const startListening = useCallback(() => {
    if (!SpeechRecognitionCtor) return
    stopListening()
    const rec = new SpeechRecognitionCtor()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = voiceLangRef.current
    rec.onresult = (e) => {
      let interimText = ''
      let finalText = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalText += r[0].transcript
        else interimText += r[0].transcript
      }
      setInterim(interimText)
      if (finalText.trim()) {
        onFinalRef.current?.(finalText.trim())
        setInterim('')
      }
    }
    rec.onerror = () => stopListening()
    rec.onend = () => {
      setListening(false)
      setInterim('')
    }
    recognitionRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch {
      setListening(false)
    }
  }, [SpeechRecognitionCtor, stopListening])

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setSpeaking(false)
  }, [])

  const speak = useCallback(
    (text) =>
      new Promise((resolve) => {
        const plain = cleanForSpeech(text)
        if (!plain || typeof window === 'undefined' || !window.speechSynthesis) {
          resolve()
          return
        }
        stopSpeaking()
        const u = new SpeechSynthesisUtterance(plain)
        u.lang = voiceLangRef.current
        u.onend = () => {
          setSpeaking(false)
          resolve()
        }
        u.onerror = () => {
          setSpeaking(false)
          resolve()
        }
        setSpeaking(true)
        window.speechSynthesis.speak(u)
      }),
    [stopSpeaking],
  )

  useEffect(
    () => () => {
      stopListening()
      stopSpeaking()
    },
    [stopListening, stopSpeaking],
  )

  return {
    speechSupported,
    listening,
    speaking,
    interim,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    cleanForSpeech,
  }
}

/**
 * One-shot dictation for the text field (mic button). Stops when final or on stop().
 */
export function useSpeechDictation({ voiceLang = 'en-US', onFinal } = {}) {
  const [SpeechRecognitionCtor] = useState(() => getSpeechRecognition())
  const speechSupported =
    typeof window !== 'undefined' && !!SpeechRecognitionCtor

  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')

  const voiceLangRef = useRef(voiceLang)
  voiceLangRef.current = voiceLang

  const onFinalRef = useRef(onFinal)
  onFinalRef.current = onFinal

  const recognitionRef = useRef(null)

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop?.()
    } catch {
      /* ignore */
    }
    recognitionRef.current = null
    setListening(false)
    setInterim('')
  }, [])

  const start = useCallback(() => {
    if (!SpeechRecognitionCtor) return
    stop()
    const rec = new SpeechRecognitionCtor()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = voiceLangRef.current
    rec.onresult = (e) => {
      let interimText = ''
      let finalText = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalText += r[0].transcript
        else interimText += r[0].transcript
      }
      setInterim(interimText)
      if (finalText.trim()) {
        onFinalRef.current?.(finalText.trim())
        stop()
      }
    }
    rec.onerror = () => stop()
    rec.onend = () => {
      setListening(false)
      setInterim('')
    }
    recognitionRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch {
      setListening(false)
    }
  }, [SpeechRecognitionCtor, stop])

  useEffect(() => () => stop(), [stop])

  return { speechSupported, listening, interim, start, stop }
}
