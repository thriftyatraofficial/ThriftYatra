import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import SellerBankModel from "@/models/SellerBank.model"
import mongoose from "mongoose"

export async function GET(request) {
    try {
        const auth = await isAuthenticated(['thrift_seller', 'brand_seller'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()

        const bankDetails = await SellerBankModel.findOne({ 
            sellerId: new mongoose.Types.ObjectId(auth.userId) 
        })

        return response(true, 200, 'Bank details fetched.', bankDetails)

    } catch (error) {
        return catchError(error)
    }
}

export async function POST(request) {
    try {
        const auth = await isAuthenticated(['thrift_seller', 'brand_seller'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const payload = await request.json()

        const { accountHolderName, bankName, accountNumber, confirmAccountNumber, ifscCode, upiId } = payload

        if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
            return response(false, 400, 'All required fields must be filled')
        }

        if (accountNumber !== confirmAccountNumber) {
            return response(false, 400, 'Account numbers do not match')
        }

        // Check if seller already has bank details
        let bankDetails = await SellerBankModel.findOne({ 
            sellerId: new mongoose.Types.ObjectId(auth.userId) 
        })

        if (bankDetails) {
            return response(false, 400, 'Bank details already exist. Please delete existing details first.')
        }

        bankDetails = new SellerBankModel({
            sellerId: auth.userId,
            accountHolderName,
            bankName,
            accountNumber,
            confirmAccountNumber,
            ifscCode,
            upiId
        })

        await bankDetails.save()

        return response(true, 200, 'Bank details saved.', bankDetails)

    } catch (error) {
        return catchError(error)
    }
}

export async function DELETE(request) {
    try {
        const auth = await isAuthenticated(['thrift_seller', 'brand_seller'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()

        const result = await SellerBankModel.deleteOne({ 
            sellerId: new mongoose.Types.ObjectId(auth.userId) 
        })

        if (result.deletedCount === 0) {
            return response(false, 404, 'No bank details found to delete.')
        }

        return response(true, 200, 'Bank details deleted successfully.')

    } catch (error) {
        return catchError(error)
    }
}