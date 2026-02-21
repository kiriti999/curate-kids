'use client'

/**
 * Link Telegram Account Page
 * 
 * Users are redirected here from Telegram bot to link their account.
 * URL params: ?tg=telegramId&group=groupId&role=admin|contributor&username=xxx&name=xxx
 */

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLinkAccount, LinkParams } from '@/utils/hooks/useLinkAccount'
import { PageLayout } from '@/components/link-account/PageLayout'
import { LoadingState } from '@/components/link-account/LoadingState'
import { AlreadyLinkedState } from '@/components/link-account/AlreadyLinkedState'
import { LoginPrompt } from '@/components/link-account/LoginPrompt'
import { SuccessState } from '@/components/link-account/SuccessState'
import { LinkConfirmation } from '@/components/link-account/LinkConfirmation'

// Loading fallback for Suspense
function LoadingFallback() {
    return (
        <PageLayout>
            <LoadingState message="Loading..." />
        </PageLayout>
    )
}

// Main component wrapped in Suspense
export default function LinkAccountPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <LinkAccountContent />
        </Suspense>
    )
}

function LinkAccountContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    // Extract params from URL
    const params: LinkParams = {
        telegramId: searchParams.get('tg'),
        groupId: searchParams.get('group'),
        role: searchParams.get('role') || 'contributor',
        telegramUsername: searchParams.get('username'),
        telegramName: searchParams.get('name'),
    }

    const { state, linkedUser, currentUser, error, handleLinkAccount } = useLinkAccount(params)

    const isOwner = params.role === 'admin'
    const displayRole = isOwner ? 'Admin (Group Owner)' : 'Contributor'

    // Loading state
    if (state === 'loading') {
        return (
            <PageLayout>
                <LoadingState message="Checking account status..." />
            </PageLayout>
        )
    }

    // Already linked state
    if (state === 'already-linked' && linkedUser) {
        return (
            <PageLayout>
                <AlreadyLinkedState linkedUser={linkedUser} />
            </PageLayout>
        )
    }

    // Not logged in - show login options
    if (state === 'not-logged-in') {
        return (
            <PageLayout>
                <LoginPrompt
                    telegramUsername={params.telegramUsername}
                    telegramName={params.telegramName}
                    searchParams={searchParams}
                    isOwner={isOwner}
                />
            </PageLayout>
        )
    }

    // Success state
    if (state === 'success') {
        return (
            <PageLayout>
                <SuccessState />
            </PageLayout>
        )
    }

    // Ready to link - show confirmation
    return (
        <PageLayout>
            <LinkConfirmation
                user={currentUser}
                telegramId={params.telegramId}
                telegramUsername={params.telegramUsername}
                telegramName={params.telegramName}
                displayRole={displayRole}
                isOwner={isOwner}
                error={error}
                isLoading={state === 'linking'}
                handleLinkAccount={handleLinkAccount}
                onCancel={() => router.push('/')}
            />
        </PageLayout>
    )
}
