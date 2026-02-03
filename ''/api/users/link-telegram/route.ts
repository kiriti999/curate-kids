/**
 * Link Telegram Account API Endpoint
 * 
 * POST /api/users/link-telegram
 * Links a Telegram account to the currently authenticated user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '../../../../payload.config'
import {
  validateTelegramIdNotLinked,
  findOrganizationByGroupId,
  updateOrganizationForUser,
  determineUserRole,
  buildUserUpdateData,
} from '../../../../lib/telegram/link-account'
import {
  unauthorizedResponse,
  badRequestResponse,
  successResponse,
  errorResponse,
} from '../../../../lib/telegram/api-responses'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const validationError = await validateRequest(body, payload, user.id)
    
    if (validationError) {
      return badRequestResponse(validationError)
    }

    const result = await linkUserAccount(body, payload, user)
    return successResponse(result)
  } catch (error) {
    console.error('Error linking Telegram account:', error)
    return errorResponse()
  }
}

async function validateRequest(body: any, payload: any, userId: string | number): Promise<string | null> {
  const { telegramId } = body

  if (!telegramId) {
    return 'Telegram ID is required'
  }

  const isValid = await validateTelegramIdNotLinked(payload, telegramId, userId)
  if (!isValid) {
    return 'This Telegram account is already linked to another user'
  }

  return null
}

async function linkUserAccount(body: any, payload: any, user: any) {
  const { telegramId, telegramUsername, telegramFirstName, groupId } = body

  const organizationId = groupId
    ? await findOrganizationByGroupId(payload, groupId)
    : null

  if (organizationId) {
    await updateOrganizationForUser(payload, organizationId, telegramId, user.id)
  }

  const userRole = await determineUserRole(
    payload,
    organizationId,
    telegramId,
    user.role
  )

  const updateData = buildUserUpdateData(
    { telegramId, telegramUsername, telegramFirstName, groupId },
    organizationId,
    userRole,
    user.role
  )

  await payload.update({
    collection: 'users',
    id: user.id,
    data: updateData,
  })

  return {
    success: true,
    message: 'Telegram account linked successfully',
    user: {
      id: user.id,
      telegramId,
      organization: organizationId,
      role: userRole,
    },
  }
}
