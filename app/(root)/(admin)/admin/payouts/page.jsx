'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, CheckCircle, XCircle, Eye, Wallet, ArrowUpRight } from 'lucide-react'
import ButtonLoading from '@/components/Application/ButtonLoading'

const AdminPayoutsPage = () => {
    const [loading, setLoading] = useState(true)
    const [payouts, setPayouts] = useState([])
    const [filteredPayouts, setFilteredPayouts] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('pending')
    const [selectedPayout, setSelectedPayout] = useState(null)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [processOpen, setProcessOpen] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [transactionId, setTransactionId] = useState('')
    const [notes, setNotes] = useState('')
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        totalAmount: 0
    })

    useEffect(() => {
        fetchPayouts()
    }, [])

    useEffect(() => {
        filterPayouts()
    }, [searchTerm, statusFilter, payouts])

    const fetchPayouts = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get('/api/admin/payouts')
            if (data.success) {
                setPayouts(data.data.payouts)
                setFilteredPayouts(data.data.payouts)
                setStats(data.data.stats)
            }
        } catch (error) {
            showToast('error', 'Failed to load payouts')
        } finally {
            setLoading(false)
        }
    }

    const filterPayouts = () => {
        let filtered = payouts.filter(p => p.status === statusFilter)
        if (searchTerm) {
            filtered = filtered.filter(p => 
                p.sellerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.sellerName?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }
        setFilteredPayouts(filtered)
    }

    const handleProcessPayout = async (action) => {
        if (action === 'approve' && !transactionId) {
            showToast('error', 'Please enter transaction ID')
            return
        }

        try {
            setProcessing(true)
            const payload = { 
                action,
                transactionId: action === 'approve' ? transactionId : undefined,
                notes: notes || undefined
            }
            await axios.put(`/api/admin/payouts/${selectedPayout._id}/process`, payload)
            showToast('success', action === 'approve' ? 'Payout approved' : 'Payout rejected')
            setProcessOpen(false)
            setDetailsOpen(false)
            setTransactionId('')
            setNotes('')
            fetchPayouts()
        } catch (error) {
            showToast('error', 'Failed to process payout')
        } finally {
            setProcessing(false)
        }
    }

    const openProcessDialog = (payout, action) => {
        setSelectedPayout(payout)
        setProcessOpen(true)
    }

    return (
        <div className='w-full'>
            <div className='flex justify-between items-center mb-6'>
                <div>
                    <h1 className='text-2xl font-bold'>Payout Management</h1>
                    <p className='text-gray-500'>Process seller withdrawal requests</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-5 gap-4 mb-6'>
                <Card><CardContent className='p-4'><p className='text-gray-500 text-sm'>Total Requests</p><p className='text-2xl font-bold'>{stats.total}</p></CardContent></Card>
                <Card className='border-yellow-200'><CardContent className='p-4'><p className='text-yellow-600 text-sm'>Pending</p><p className='text-2xl font-bold text-yellow-600'>{stats.pending}</p></CardContent></Card>
                <Card className='border-blue-200'><CardContent className='p-4'><p className='text-blue-600 text-sm'>Processing</p><p className='text-2xl font-bold text-blue-600'>{stats.processing}</p></CardContent></Card>
                <Card className='border-green-200'><CardContent className='p-4'><p className='text-green-600 text-sm'>Completed</p><p className='text-2xl font-bold text-green-600'>{stats.completed}</p></CardContent></Card>
                <Card className='border-purple-200'><CardContent className='p-4'><p className='text-purple-600 text-sm'>Total Amount</p><p className='text-xl font-bold text-purple-600'>{formatCurrency(stats.totalAmount)}</p></CardContent></Card>
            </div>

            {/* Filters */}
            <div className='flex gap-4 mb-4'>
                <div className='relative flex-1 max-w-md'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                    <Input placeholder="Search by Seller ID or Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-10' />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className='w-[180px]'>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Payouts Table */}
            <Card>
                <CardHeader><h2 className='text-lg font-semibold'>{statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Requests</h2></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className='text-center py-10'>Loading...</div>
                    ) : filteredPayouts.length === 0 ? (
                        <div className='text-center py-10 text-gray-500'><Wallet className='h-12 w-12 mx-auto text-gray-300 mb-3' /><p>No {statusFilter} payout requests</p></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Seller</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Request Date</TableHead>
                                    <TableHead>Bank Details</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className='text-right'>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayouts.map((payout) => (
                                    <TableRow key={payout._id}>
                                        <TableCell>
                                            <div>
                                                <p className='font-medium'>{payout.sellerName}</p>
                                                <p className='text-xs text-gray-500'>ID: {payout.sellerId}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className='font-semibold'>{formatCurrency(payout.amount)}</TableCell>
                                        <TableCell>{formatDate(payout.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className='text-xs'>
                                                <p>{payout.bankDetails?.accountHolderName}</p>
                                                <p className='text-gray-500'>{payout.bankDetails?.bankName} - {payout.bankDetails?.accountNumber}</p>
                                                <p className='text-gray-500'>IFSC: {payout.bankDetails?.ifscCode}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={
                                                payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                payout.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }>{payout.status}</Badge>
                                        </TableCell>
                                        <TableCell className='text-right'>
                                            <div className='flex justify-end gap-2'>
                                                <Button variant="ghost" size="icon" onClick={() => { setSelectedPayout(payout); setDetailsOpen(true) }}>
                                                    <Eye className='h-4 w-4' />
                                                </Button>
                                                {payout.status === 'pending' && (
                                                    <>
                                                        <Button size="sm" className='bg-green-600 hover:bg-green-700' onClick={() => openProcessDialog(payout, 'approve')}>
                                                            <CheckCircle className='h-4 w-4 mr-1' /> Approve
                                                        </Button>
                                                        <Button size="sm" variant="destructive" onClick={() => openProcessDialog(payout, 'reject')}>
                                                            <XCircle className='h-4 w-4 mr-1' /> Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Process Dialog */}
            <Dialog open={processOpen} onOpenChange={setProcessOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Process Payout</DialogTitle>
                        <DialogDescription>
                            {selectedPayout?.status === 'pending' ? 'Approve or reject this withdrawal request' : 'View payout details'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4 py-4'>
                        <div className='bg-gray-50 p-3 rounded'><p className='text-sm text-gray-500'>Amount</p><p className='text-xl font-bold'>{formatCurrency(selectedPayout?.amount)}</p></div>
                        <div className='bg-gray-50 p-3 rounded'><p className='text-sm text-gray-500'>Seller</p><p className='font-medium'>{selectedPayout?.sellerName}</p></div>
                        <div>
                            <Label>Transaction ID (Required for approval)</Label>
                            <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="e.g., UTR/Reference number" />
                        </div>
                        <div>
                            <Label>Notes (Optional)</Label>
                            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes..." rows={2} />
                        </div>
                    </div>
                    <DialogFooter className='flex gap-2'>
                        <Button variant="outline" onClick={() => setProcessOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => handleProcessPayout('reject')} disabled={processing}>
                            <XCircle className='h-4 w-4 mr-1' /> Reject
                        </Button>
                        <ButtonLoading loading={processing} onClick={() => handleProcessPayout('approve')} text="Approve Payout" className='bg-green-600 hover:bg-green-700' />
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Payout Details</DialogTitle></DialogHeader>
                    <div className='space-y-3 py-4'>
                        <div><Label>Seller</Label><p className='font-medium'>{selectedPayout?.sellerName} ({selectedPayout?.sellerId})</p></div>
                        <div><Label>Amount</Label><p className='text-xl font-bold text-green-600'>{formatCurrency(selectedPayout?.amount)}</p></div>
                        <div><Label>Status</Label><Badge>{selectedPayout?.status}</Badge></div>
                        <div><Label>Request Date</Label><p>{formatDate(selectedPayout?.createdAt)}</p></div>
                        {selectedPayout?.processedAt && <div><Label>Processed Date</Label><p>{formatDate(selectedPayout.processedAt)}</p></div>}
                        <div><Label>Bank Details</Label><div className='bg-gray-50 p-3 rounded'><p>{selectedPayout?.bankDetails?.accountHolderName}</p><p className='text-sm'>{selectedPayout?.bankDetails?.bankName}</p><p className='text-sm'>A/C: {selectedPayout?.bankDetails?.accountNumber}</p><p className='text-sm'>IFSC: {selectedPayout?.bankDetails?.ifscCode}</p></div></div>
                        {selectedPayout?.transactionId && <div><Label>Transaction ID</Label><code className='text-sm'>{selectedPayout.transactionId}</code></div>}
                    </div>
                    <DialogFooter><Button onClick={() => setDetailsOpen(false)}>Close</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AdminPayoutsPage