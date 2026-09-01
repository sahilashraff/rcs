import FileDoc from '@/assets/svg/files/FileDoc'
import FileXls from '@/assets/svg/files/FileXls'
import FilePdf from '@/assets/svg/files/FilePdf'
import FilePpt from '@/assets/svg/files/FilePpt'
import FileFigma from '@/assets/svg/files/FileFigma'
import FileImage from '@/assets/svg/files/FileImage'
import Folder from '@/assets/svg/files/Folder'

const FileIcon = ({ type, size = 40 }: { type: string; size?: number }) => {
    switch (type.toLowerCase()) {
        case 'pdf':
            return <FilePdf height={size} width={size} />
        case 'xls':
        case 'xlsx':
        case 'csv':
            return <FileXls height={size} width={size} />
        case 'doc':
        case 'docx':
        case 'txt':
            return <FileDoc height={size} width={size} />
        case 'ppt':
        case 'pptx':
            return <FilePpt height={size} width={size} />
        case 'figma':
            return <FileFigma height={size} width={size} />
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'webp':
        case 'svg':
        case 'gif':
            return <FileImage height={size} width={size} />
        case 'directory':
        case 'folder':
            return <Folder height={size} width={size} />
        default:
            return <FileDoc height={size} width={size} />
    }
}

export default FileIcon
