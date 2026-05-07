import { NextResponse } from "next/server"

export const response = (success, statusCode, message, data = {}) => {
    const safeStatus = Number.isInteger(statusCode) && statusCode >= 100 && statusCode <= 599
        ? statusCode
        : success ? 200 : 500

    return NextResponse.json({
        success, statusCode: safeStatus, message, data
    }, {
        status: safeStatus
    })
}

export const catchError = (error, customMessage) => {
    console.error('❌ catchError:', error)
    
    if (error.code === 11000) {
        const keys = Object.keys(error.keyPattern).join(',')
        error.message = `Duplicate fields: ${keys}. These fields value must be unique.`
    }

    let errorObj = {}

    if (process.env.NODE_ENV === 'development') {
        errorObj = {
            message: error.message,
            error: error.toString()
        }
    } else {
        errorObj = {
            message: customMessage || 'Internal server error.',
        }
    }

    const safeStatus = error.code === 11000
        ? 400
        : Number.isInteger(error.code) && error.code >= 100 && error.code <= 599
            ? error.code
            : 500

    return NextResponse.json({
        success: false,
        statusCode: safeStatus,
        ...errorObj
    }, {
        status: safeStatus
    })
}

export const generateOTP = () => {
    const values = new Uint32Array(1)
    if (globalThis.crypto?.getRandomValues) {
        globalThis.crypto.getRandomValues(values)
        return String(100000 + (values[0] % 900000))
    }
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export const columnConfig = (column, isCreatedAt = false, isUpdatedAt = false, isDeletedAt = false) => {
    const newColumn = [...column]

    if (isCreatedAt) {
        newColumn.push({
            accessorKey: 'createdAt',
            header: 'Created At',
            Cell: ({ renderedCellValue }) => (new Date(renderedCellValue).toLocaleString())
        })
    }
    if (isUpdatedAt) {
        newColumn.push({
            accessorKey: 'updatedAt',
            header: 'Updated At',
            Cell: ({ renderedCellValue }) => (new Date(renderedCellValue).toLocaleString())
        })
    }
    if (isDeletedAt) {
        newColumn.push({
            accessorKey: 'deletedAt',
            header: 'Deleted At',
            Cell: ({ renderedCellValue }) => (new Date(renderedCellValue).toLocaleString())
        })
    }

    return newColumn
}

export const statusBadge = (status) => {
    const statusColorConfig = {
        pending: 'bg-blue-500',
        processing: 'bg-yellow-500',
        shipped: 'bg-cyan-500',
        delivered: 'bg-green-500',
        cancelled: 'bg-red-500',
        unverified: 'bg-orange-500',
    }
    return <span className={`${statusColorConfig[status]} capitalize px-3 py-1 rounded-full text-xs`}>{status}</span>
}
