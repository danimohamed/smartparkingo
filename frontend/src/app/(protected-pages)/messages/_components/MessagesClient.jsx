'use client'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import EmptyState from '@/components/shared/EmptyState'
import classNames from 'classnames'
import { PiChatCircleDuotone, PiPaperPlaneRightDuotone } from 'react-icons/pi'
import { HiPhone } from 'react-icons/hi'
import {
    apiListGuardChats,
    apiGetGuardChatMessages,
    apiSendGuardChatMessage,
} from '@/services/GuardChatService'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'

export default function MessagesClient() {
    const t = useTranslations('messages')
    const tToast = useTranslations('messages.toast')
    const searchParams = useSearchParams()
    const [chats, setChats] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState(null)
    const [messages, setMessages] = useState([])
    const [loadingMsgs, setLoadingMsgs] = useState(false)
    const [draft, setDraft] = useState('')
    const [sending, setSending] = useState(false)

    const loadChats = useCallback(async () => {
        setLoading(true)
        try {
            const res = await apiListGuardChats()
            const list = res?.data ?? []
            setChats(Array.isArray(list) ? list : [])
        } catch (e) {
            toast.push(
                <Notification title={tToast('loadChatsFailed')} type="danger">
                    {e?.response?.data?.message || e?.message || tToast('tryAgainLater')}
                </Notification>,
            )
            setChats([])
        } finally {
            setLoading(false)
        }
    }, [tToast])

    useEffect(() => {
        loadChats()
    }, [loadChats])

    const chatFromUrl = searchParams.get('chat')

    useEffect(() => {
        if (!chatFromUrl || chats.length === 0) return
        const id = Number(chatFromUrl)
        if (Number.isNaN(id)) return
        if (chats.some((c) => c.id === id)) {
            setSelectedId(id)
        }
    }, [chatFromUrl, chats])

    const loadMessages = useCallback(async (chatId) => {
        if (!chatId) return
        setLoadingMsgs(true)
        try {
            const res = await apiGetGuardChatMessages(chatId)
            setMessages(res?.data ?? [])
        } catch (e) {
            toast.push(
                <Notification title={tToast('loadMessagesFailed')} type="danger">
                    {e?.response?.data?.message || e?.message}
                </Notification>,
            )
            setMessages([])
        } finally {
            setLoadingMsgs(false)
        }
    }, [tToast])

    useEffect(() => {
        if (selectedId) loadMessages(selectedId)
        else setMessages([])
    }, [selectedId, loadMessages])

    const handleSend = async () => {
        const text = draft.trim()
        if (!text || !selectedId) return
        setSending(true)
        try {
            await apiSendGuardChatMessage(selectedId, text)
            setDraft('')
            await loadMessages(selectedId)
            await loadChats()
        } catch (e) {
            toast.push(
                <Notification title={tToast('sendFailed')} type="danger">
                    {e?.response?.data?.message || e?.message}
                </Notification>,
            )
        } finally {
            setSending(false)
        }
    }

    const selected = chats.find((c) => c.id === selectedId)
    const callPhoneRaw =
        selected?.guardPhone || selected?.peerPhone || selected?.phone || selected?.peerPhoneNumber
    const callPhone = callPhoneRaw ? String(callPhoneRaw).replace(/[^\d+]/g, '') : ''

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h3 className="mb-1 text-2xl font-bold">{t('title')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('subtitle')}
                </p>
            </div>

            <div className="grid min-h-[420px] gap-4 lg:grid-cols-[minmax(220px,280px)_1fr]">
                <Card className="overflow-hidden p-0">
                    <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('conversations')}</span>
                    </div>
                    <div className="max-h-[480px] overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-sm text-gray-400">{t('loading')}</div>
                        ) : chats.length === 0 ? (
                            <div className="p-4">
                                <EmptyState
                                    title={t('emptyTitle')}
                                    description={t('emptyDescription')}
                                />
                            </div>
                        ) : (
                            chats.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setSelectedId(c.id)}
                                    className={classNames(
                                        'flex w-full flex-col items-start gap-0.5 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50',
                                        selectedId === c.id && 'bg-primary/5 dark:bg-primary/10',
                                    )}
                                >
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">{c.peerFullName}</span>
                                    <span className="text-xs text-gray-500">{c.parkingName}</span>
                                    <span className="text-[10px] text-gray-400">
                                        {c.updatedAt ? dayjs(c.updatedAt).format('MMM D, HH:mm') : ''}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </Card>

                <Card className="flex flex-col overflow-hidden p-0">
                    {!selectedId ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-gray-500">
                            <PiChatCircleDuotone className="text-4xl opacity-40" />
                            <p className="text-sm">{t('selectConversation')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="truncate font-semibold">{selected?.peerFullName}</div>
                                        <div className="truncate text-xs text-gray-500">{selected?.parkingName}</div>
                                    </div>
                                    {callPhone ? (
                                        <a
                                            href={`tel:${callPhone}`}
                                            className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary/15 active:scale-[0.98] dark:bg-primary/20"
                                        >
                                            <HiPhone className="text-lg" aria-hidden />
                                            <span className="hidden sm:inline">{t('call')}</span>
                                        </a>
                                    ) : null}
                                </div>
                            </div>
                            <div className="flex max-h-[360px] flex-1 flex-col gap-2 overflow-y-auto p-4">
                                {loadingMsgs ? (
                                    <div className="text-sm text-gray-400">{t('loadingMessages')}</div>
                                ) : (
                                    messages.map((m) => (
                                        <div
                                            key={m.id}
                                            className={classNames(
                                                'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                                                m.systemMessage &&
                                                    'self-center max-w-full bg-gray-100 text-center text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300',
                                                !m.systemMessage && m.fromMe && 'ml-auto bg-primary text-white',
                                                !m.systemMessage && !m.fromMe &&
                                                    'mr-auto bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
                                            )}
                                        >
                                            {!m.systemMessage && m.senderFullName && (
                                                <div className="mb-0.5 text-[10px] font-semibold opacity-80">
                                                    {m.senderFullName}
                                                </div>
                                            )}
                                            <div className="whitespace-pre-wrap break-words">{m.body}</div>
                                            <div className="mt-1 text-[10px] opacity-60">
                                                {m.createdAt ? dayjs(m.createdAt).format('MMM D, HH:mm') : ''}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="flex gap-2 border-t border-gray-100 p-3 dark:border-gray-700">
                                <Input
                                    textArea
                                    rows={2}
                                    placeholder={t('typeMessage')}
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSend()
                                        }
                                    }}
                                />
                                <Button
                                    variant="solid"
                                    className="shrink-0 self-end"
                                    loading={sending}
                                    disabled={!draft.trim()}
                                    onClick={handleSend}
                                >
                                    <PiPaperPlaneRightDuotone className="text-lg" />
                                </Button>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    )
}
