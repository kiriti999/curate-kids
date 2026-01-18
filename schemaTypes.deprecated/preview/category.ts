export const categoryPreview = {
  select: {
    title: 'name',
    ageRange: 'ageRange',
    fullPath: 'fullPath',
    depth: 'depth',
    isAgeRangeRoot: 'isAgeRangeRoot',
    media: 'icon',
  },
  prepare({title, ageRange, fullPath, depth, isAgeRangeRoot, media}: any) {
    const pathDisplay = fullPath && fullPath.length > 0 ? fullPath.join(' → ') : title
    const badge = isAgeRangeRoot ? '🏠 Root' : `Level ${depth}`

    return {
      title,
      subtitle: `${badge} | ${pathDisplay}`,
      media,
    }
  },
}
