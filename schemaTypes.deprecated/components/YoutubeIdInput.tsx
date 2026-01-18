import { StringInputProps, set, unset, useFormValue } from 'sanity'
import { useCallback, useEffect } from 'react'
import { extractYoutubeId } from '../utils/extractYoutubeId'

export function YoutubeIdInput(props: StringInputProps) {
    const { onChange, value } = props

    // Get the YouTube URL from the document using useFormValue
    const youtubeUrl = useFormValue(['youtubeUrl']) as string | undefined

    // Auto-extract YouTube ID whenever the URL changes
    useEffect(() => {
        if (youtubeUrl) {
            const extractedId = extractYoutubeId(youtubeUrl)
            if (extractedId && extractedId !== value) {
                onChange(set(extractedId))
            }
        } else if (value) {
            onChange(unset())
        }
    }, [youtubeUrl, value, onChange])

    // Don't render anything - this is a hidden field
    return null
}
