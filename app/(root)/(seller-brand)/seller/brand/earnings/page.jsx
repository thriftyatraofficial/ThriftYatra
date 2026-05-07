'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from '@/components/ui/badge'
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
    Wallet, Clock, CheckCircle, Building2, ArrowUpRight, Plus,
    Download, Filter, Calendar, ArrowUp, ArrowDown, RefreshCw, Trash2
} from 'lucide-react'
import { useSelector } from 'react-redux'
import ButtonLoading from '@/components/Application/ButtonLoading'

const BrandEarningsPage = () => {
    const { auth } = useSelector(state => state.authStore)
    const [loading, setLoading] = useState(true)
    const [wallet, setWallet] = useState(null)
    const [transactions, setTransactions] = useState([])
    const [payouts, setPayouts] = useState([])
    const [bankDetails, setBankDetails] = useState(null)
    const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false)
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [withdrawing, setWithdrawing] = useState(false)
    const [bankFormOpen, setBankFormOpen] = useState(false)
    const [deleteBankDialogOpen, setDeleteBankDialogOpen] = useState(false)
    const [filterType, setFilterType] = useState('all')
    const [dateRange, setDateRange] = useState('30')
    const [activeTab, setActiveTab] = useState('transactions')
    const [bankForm, setBankForm] = useState({
        accountHolderName: '', bankName: '', accountNumber: '', confirmAccountNumber: '', ifscCode: '', upiId: ''
    })
    const [savingBank, setSavingBank] = useState(false)

    useEffect(() => {
        fetchEarningsData()
    }, [dateRange])

    const fetchEarningsData = async () => {
        try {
            setLoading(true)
            const [walletRes, txRes, payoutRes, bankRes] = await Promise.all([
                axios.get('/api/seller/wallet').catch(() => ({ data: { success: false } })),
                axios.get(`/api/seller/transactions?days=${dateRange}`).catch(() => ({ data: { success: false } })),
                axios.get('/api/seller/payouts').catch(() => ({ data: { success: false } })),
                axios.get('/api/seller/bank').catch(() => ({ data: { data: null } }))
            ])
            if (walletRes.data.success) setWallet(walletRes.data.data)
            if (txRes.data.success) setTransactions(txRes.data.data)
            if (payoutRes.data.success) setPayouts(payoutRes.data.data)
            if (bankRes.data.success) setBankDetails(bankRes.data.data)
        } catch (error) {
            console.error('Failed to load earnings:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleWithdraw = async () => {
        if (!withdrawAmount || Number(withdrawAmount) < 100) {
            showToast('error', 'Minimum withdrawal amount is ₹100')
            return
        }
        if (Number(withdrawAmount) > (wallet?.availableBalance || 0)) {
            showToast('error', 'Insufficient available balance')
            return
        }
        if (!bankDetails) {
            showToast('error', 'Please add bank details first')
            return
        }
        try {
            setWithdrawing(true)
            const { data } = await axios.post('/api/seller/payouts/request', { amount: Number(withdrawAmount) })
            if (data.success) {
                showToast('success', 'Withdrawal request submitted successfully')
                setWithdrawDialogOpen(false)
                setWithdrawAmount('')
                fetchEarningsData()
            } else {
                showToast('error', data.message || 'Withdrawal failed')
            }
        } catch (error) {
            showToast('error', error.response?.data?.message || 'Withdrawal failed')
        } finally {
            setWithdrawing(false)
        }
    }

    const handleSaveBank = async () => {
        if (!bankForm.accountHolderName || !bankForm.bankName || !bankForm.accountNumber || !bankForm.ifscCode) {
            showToast('error', 'Please fill all required fields')
            return
        }
        if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
            showToast('error', 'Account numbers do not match')
            return
        }
        try {
            setSavingBank(true)
            const { data } = await axios.post('/api/seller/bank', bankForm)
            if (data.success) {
                showToast('success', 'Bank details saved successfully')
                setBankFormOpen(false)
                setBankDetails(data.data)
                setBankForm({ accountHolderName: '', bankName: '', accountNumber: '', confirmAccountNumber: '', ifscCode: '', upiId: '' })
            } else {
                showToast('error', data.message || 'Failed to save bank details')
            }
        } catch (error) {
            showToast('error', error.response?.data?.message || 'Failed to save bank details')
        } finally {
            setSavingBank(false)
        }
    }

    const handleDeleteBank = async () => {
        try {
            const { data } = await axios.delete('/api/seller/bank')
            if (data.success) {
                showToast('success', 'Bank details deleted successfully')
                setBankDetails(null)
                setDeleteBankDialogOpen(false)
            } else {
                showToast('error', data.message || 'Failed to delete bank details')
            }
        } catch (error) {
            showToast('error', error.response?.data?.message || 'Failed to delete bank details')
        }
    }

    const filteredTransactions = transactions.filter(tx => filterType === 'all' ? true : tx.type === filterType)
    const totalCredits = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0)
    const totalDebits = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0)

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className='w-full'>
            {/* Header */}
            <div className='flex justify-between items-center mb-5'>
                <div>
                    <h1 className='text-2xl font-bold'>Earnings & Payouts</h1>
                    <p className='text-gray-500'>Manage your earnings, transactions, and withdrawals</p>
                </div>
                <div className="flex gap-2">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[140px]"><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="7">Last 7 days</SelectItem><SelectItem value="30">Last 30 days</SelectItem><SelectItem value="90">Last 90 days</SelectItem><SelectItem value="365">Last year</SelectItem></SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchEarningsData}><RefreshCw className="h-4 w-4" /></Button>
                </div>
            </div>

            {/* Wallet Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-blue-600 font-medium">Total Earned</p><p className="text-2xl font-bold text-blue-700">{formatCurrency(wallet?.totalEarned || 0)}</p></div><Wallet className="h-10 w-10 text-blue-500 opacity-50" /></div></CardContent></Card>
                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-yellow-600 font-medium">Pending</p><p className="text-2xl font-bold text-yellow-700">{formatCurrency(wallet?.pendingAmount || 0)}</p></div><Clock className="h-10 w-10 text-yellow-500 opacity-50" /></div></CardContent></Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-green-600 font-medium">Available</p><p className="text-2xl font-bold text-green-700">{formatCurrency(wallet?.availableBalance || 0)}</p></div><CheckCircle className="h-10 w-10 text-green-500 opacity-50" /></div></CardContent></Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-purple-600 font-medium">Withdrawn</p><p className="text-2xl font-bold text-purple-700">{formatCurrency(wallet?.withdrawnAmount || 0)}</p></div><ArrowUpRight className="h-10 w-10 text-purple-500 opacity-50" /></div></CardContent></Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><ArrowUp className="h-5 w-5 text-green-500" /><div><p className="text-xs text-gray-500">Credits</p><p className="text-lg font-semibold text-green-600">{formatCurrency(totalCredits)}</p></div></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><ArrowDown className="h-5 w-5 text-red-500" /><div><p className="text-xs text-gray-500">Debits</p><p className="text-lg font-semibold text-red-600">{formatCurrency(totalDebits)}</p></div></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><ArrowUp className="h-5 w-5 text-blue-500" /><div><p className="text-xs text-gray-500">Net</p><p className="text-lg font-semibold text-blue-600">{formatCurrency(totalCredits - totalDebits)}</p></div></div></CardContent></Card>
            </div>

            {/* Bank Details Card */}
            <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between"><div><h2 className="text-lg font-semibold">Bank Account</h2><p className="text-sm text-gray-500">For receiving withdrawals</p></div></CardHeader>
                <CardContent>
                    {bankDetails ? (
                        <div className="flex justify-between items-center">
                            <div className="space-y-1"><p className="font-medium">{bankDetails.accountHolderName}</p><p className="text-sm text-gray-600">{bankDetails.bankName}</p><p className="text-sm text-gray-600">A/C: {bankDetails.accountNumber} | IFSC: {bankDetails.ifscCode}</p>{bankDetails.upiId && <p className="text-sm text-gray-600">UPI: {bankDetails.upiId}</p>}</div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteBankDialogOpen(true)}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
                                <Button onClick={() => setWithdrawDialogOpen(true)} disabled={!wallet?.availableBalance || wallet.availableBalance < 100} className="bg-green-600 hover:bg-green-700"><ArrowUpRight className="h-4 w-4 mr-2" />Withdraw</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6"><Building2 className="h-12 w-12 mx-auto text-gray-400 mb-3" /><p className="text-gray-600 mb-4">Add your bank account to withdraw earnings</p><Button onClick={() => setBankFormOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Bank Account</Button></div>
                    )}
                </CardContent>
            </Card>

            {/* Tab Switcher */}
            <div className="flex gap-2 mb-4 border-b">
                <button onClick={() => setActiveTab('transactions')} className={`px-4 py-2 font-medium ${activeTab === 'transactions' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Transactions</button>
                <button onClick={() => setActiveTab('payouts')} className={`px-4 py-2 font-medium ${activeTab === 'payouts' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Payout History</button>
            </div>

            {/* Transactions Table */}
            {activeTab === 'transactions' && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between"><h2 className="text-lg font-semibold">Recent Transactions</h2><div className="flex gap-2"><Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="w-[130px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="credit">Credits Only</SelectItem><SelectItem value="debit">Debits Only</SelectItem></SelectContent></Select><Button variant="outline" size="icon"><Download className="h-4 w-4" /></Button></div></CardHeader>
                    <CardContent>
                        {filteredTransactions.length === 0 ? <div className="text-center py-12"><Clock className="h-12 w-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No transactions found</p></div> : (
                            <Table><TableHeader><TableRow className="bg-muted/50"><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Order ID</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                            <TableBody>{filteredTransactions.map(tx => (
                                <TableRow key={tx._id}><TableCell>{formatDate(tx.createdAt)}</TableCell><TableCell>{tx.description}</TableCell><TableCell className="font-mono text-xs">{tx.orderId?.slice(-8) || '—'}</TableCell><TableCell><Badge className={tx.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{tx.type === 'credit' ? 'Credit' : 'Debit'}</Badge></TableCell><TableCell className={`text-right font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>{tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}</TableCell><TableCell><Badge variant="outline" className={tx.status === 'completed' ? 'bg-green-50' : tx.status === 'pending' ? 'bg-yellow-50' : 'bg-gray-50'}>{tx.status}</Badge></TableCell></TableRow>
                            ))}</TableBody></Table>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Payouts Table */}
            {activeTab === 'payouts' && (
                <Card><CardHeader><h2 className="text-lg font-semibold">Payout History</h2></CardHeader><CardContent>
                    {payouts.length === 0 ? <div className="text-center py-12"><ArrowUpRight className="h-12 w-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No payout requests yet</p></div> : (
                        <Table><TableHeader><TableRow className="bg-muted/50"><TableHead>Request Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Processed Date</TableHead><TableHead>Reference ID</TableHead></TableRow></TableHeader>
                        <TableBody>{payouts.map(p => (
                            <TableRow key={p._id}><TableCell>{formatDate(p.createdAt)}</TableCell><TableCell className="font-semibold">{formatCurrency(p.amount)}</TableCell><TableCell><Badge className={p.status === 'completed' ? 'bg-green-100' : p.status === 'processing' ? 'bg-blue-100' : p.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'}>{p.status}</Badge></TableCell><TableCell>{p.processedAt ? formatDate(p.processedAt) : '—'}</TableCell><TableCell className="font-mono text-xs">{p.transactionId || '—'}</TableCell></TableRow>
                        ))}</TableBody></Table>
                    )}
                </CardContent></Card>
            )}

            {/* Withdraw Dialog */}
            <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
                <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Withdraw Funds</DialogTitle><DialogDescription>Available: <span className="font-semibold text-green-600">{formatCurrency(wallet?.availableBalance || 0)}</span></DialogDescription></DialogHeader>
                <div className="py-4 space-y-4"><div><Label>Amount (₹)</Label><Input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} min={100} max={wallet?.availableBalance} className="mt-1 text-lg" /><p className="text-xs text-gray-500 mt-1">Minimum: ₹100</p></div>{bankDetails && <div className="bg-gray-50 p-3 rounded-lg"><p className="text-sm font-medium mb-2">Funds will be sent to:</p><p className="text-sm">{bankDetails.accountHolderName}</p><p className="text-sm text-gray-500">{bankDetails.bankName} - A/C: {bankDetails.accountNumber}</p><p className="text-sm text-gray-500">IFSC: {bankDetails.ifscCode}</p></div>}</div>
                <DialogFooter><Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>Cancel</Button><ButtonLoading loading={withdrawing} onClick={handleWithdraw} text="Confirm Withdrawal" disabled={!withdrawAmount || Number(withdrawAmount) < 100 || Number(withdrawAmount) > (wallet?.availableBalance || 0)} className="bg-green-600 hover:bg-green-700" /></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bank Form Dialog */}
            <Dialog open={bankFormOpen} onOpenChange={setBankFormOpen}>
                <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Add Bank Account</DialogTitle><DialogDescription>Enter your bank details for withdrawals</DialogDescription></DialogHeader>
                <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto"><div><Label>Account Holder *</Label><Input value={bankForm.accountHolderName} onChange={(e) => setBankForm({...bankForm, accountHolderName: e.target.value})} /></div><div><Label>Bank Name *</Label><Input value={bankForm.bankName} onChange={(e) => setBankForm({...bankForm, bankName: e.target.value})} /></div><div><Label>Account Number *</Label><Input value={bankForm.accountNumber} onChange={(e) => setBankForm({...bankForm, accountNumber: e.target.value})} /></div><div><Label>Confirm Account *</Label><Input value={bankForm.confirmAccountNumber} onChange={(e) => setBankForm({...bankForm, confirmAccountNumber: e.target.value})} /></div><div><Label>IFSC Code *</Label><Input value={bankForm.ifscCode} onChange={(e) => setBankForm({...bankForm, ifscCode: e.target.value})} /></div><div><Label>UPI ID (Optional)</Label><Input value={bankForm.upiId} onChange={(e) => setBankForm({...bankForm, upiId: e.target.value})} /></div></div>
                <DialogFooter><Button variant="outline" onClick={() => setBankFormOpen(false)}>Cancel</Button><ButtonLoading loading={savingBank} onClick={handleSaveBank} text="Save Bank Details" /></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Bank Dialog */}
            <Dialog open={deleteBankDialogOpen} onOpenChange={setDeleteBankDialogOpen}>
                <DialogContent><DialogHeader><DialogTitle>Delete Bank Account</DialogTitle><DialogDescription>Are you sure? You'll need to add a new account to withdraw.</DialogDescription></DialogHeader>
                <DialogFooter><Button variant="outline" onClick={() => setDeleteBankDialogOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDeleteBank}>Delete</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default BrandEarningsPage