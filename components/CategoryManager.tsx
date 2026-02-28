'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CategoryItem {
    id: string
    value: string
    label: string
    description: string
    videoCount: number
    sortOrder: number
}

interface CategoryManagerProps {
    open: boolean
    onClose: () => void
    onCategoriesChanged?: () => void
}

export default function CategoryManager({ open, onClose, onCategoriesChanged }: CategoryManagerProps) {
    const [categories, setCategories] = useState<CategoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [newName, setNewName] = useState('')
    const [newDescription, setNewDescription] = useState('')
    const [creating, setCreating] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const fetchCategories = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/frontend-categories')
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setCategories(data.categories || [])
        } catch {
            setError('Failed to load categories')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (open) {
            fetchCategories()
            setError(null)
            setSuccess(null)
        }
    }, [open, fetchCategories])

    const handleCreate = async () => {
        if (!newName.trim()) return
        setCreating(true)
        setError(null)
        setSuccess(null)

        try {
            const res = await fetch('/api/frontend-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName.trim(),
                    description: newDescription.trim(),
                    ageRange: '0-2',
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to create category')
                return
            }

            setCategories(prev => [...prev, data.category])
            setNewName('')
            setNewDescription('')
            setSuccess(`"${data.category.label}" created successfully`)
            onCategoriesChanged?.()
        } catch {
            setError('Failed to create category. Please try again.')
        } finally {
            setCreating(false)
        }
    }

    const handleDelete = async (cat: CategoryItem) => {
        if (!confirm(`Are you sure you want to delete "${cat.label}"? This cannot be undone.`)) {
            return
        }

        setDeletingId(cat.id)
        setError(null)
        setSuccess(null)

        try {
            const res = await fetch(`/api/frontend-categories/${cat.id}`, {
                method: 'DELETE',
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to delete category')
                return
            }

            setCategories(prev => prev.filter(c => c.id !== cat.id))
            setSuccess(data.message)
            onCategoriesChanged?.()
        } catch {
            setError('Failed to delete category. Please try again.')
        } finally {
            setDeletingId(null)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
                    <div>
                        <h2 className="text-lg font-semibold">Manage Categories</h2>
                        <p className="text-sm text-muted-foreground">Add or remove video categories</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">
                    {/* Status messages */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm">
                            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Add new category */}
                    <Card className="border-dashed border-2 border-primary/30">
                        <CardContent className="p-4 space-y-3">
                            <h3 className="font-medium text-sm text-primary flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Add New Category
                            </h3>
                            <Input
                                placeholder="Category name (e.g. Cooking)"
                                value={newName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                                onKeyDown={(e: React.KeyboardEvent) => {
                                    if (e.key === 'Enter' && newName.trim()) handleCreate()
                                }}
                                disabled={creating}
                            />
                            <Input
                                placeholder="Description (optional)"
                                value={newDescription}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDescription(e.target.value)}
                                disabled={creating}
                            />
                            <Button
                                onClick={handleCreate}
                                disabled={!newName.trim() || creating}
                                size="sm"
                                className="w-full"
                            >
                                {creating ? (
                                    <span className="flex items-center gap-2">
                                        <span className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                                        Creating...
                                    </span>
                                ) : (
                                    'Add Category'
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Existing categories */}
                    <div>
                        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">
                            Existing Categories ({categories.length})
                        </h3>

                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
                                ))}
                            </div>
                        ) : categories.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No categories yet. Add one above to get started.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {categories.map(cat => (
                                    <div
                                        key={cat.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm truncate">{cat.label}</span>
                                                {cat.videoCount > 0 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {cat.videoCount} video{cat.videoCount !== 1 ? 's' : ''}
                                                    </Badge>
                                                )}
                                            </div>
                                            {cat.description && (
                                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                    {cat.description}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(cat)}
                                            disabled={deletingId === cat.id}
                                            className="ml-3 p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                                            aria-label={`Delete ${cat.label}`}
                                            title={cat.videoCount > 0 ? 'Has videos — cannot delete' : `Delete ${cat.label}`}
                                        >
                                            {deletingId === cat.id ? (
                                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent inline-block" />
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t bg-muted/30">
                    <Button variant="outline" size="sm" onClick={onClose} className="w-full">
                        Done
                    </Button>
                </div>
            </div>
        </div>
    )
}
