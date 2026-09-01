const getFileType = (type: string) => {
    switch (type.toLowerCase()) {
        case 'pdf':
            return 'PDF'
        case 'xls':
        case 'xlsx':
            return 'Excel'
        case 'csv':
            return 'CSV'
        case 'doc':
        case 'docx':
            return 'Word'
        case 'txt':
            return 'Text'
        case 'ppt':
        case 'pptx':
            return 'PPT'
        case 'figma':
            return 'Figma'
        case 'jpeg':
        case 'jpg':
            return 'JPEG'
        case 'png':
            return 'PNG'
        case 'webp':
            return 'WebP'
        case 'svg':
            return 'SVG'
        case 'gif':
            return 'GIF'
        case 'zip':
            return 'ZIP'
        default:
            return type.toUpperCase()
    }
}

const FileType = ({ type }: { type: string }) => {
    return <span>{getFileType(type)}</span>
}

export default FileType
