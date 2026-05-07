'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Ruler } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const SizeChartBuilder = ({ value, onChange }) => {
    const [chartType, setChartType] = useState(value?.type || 'measurements')
    const [measurements, setMeasurements] = useState(value?.measurements || '')
    const [sizeTable, setSizeTable] = useState(value?.sizeTable || [
        { size: 'S', chest: '', length: '', shoulder: '', sleeve: '' },
        { size: 'M', chest: '', length: '', shoulder: '', sleeve: '' },
        { size: 'L', chest: '', length: '', shoulder: '', sleeve: '' },
        { size: 'XL', chest: '', length: '', shoulder: '', sleeve: '' },
    ])

    const updateSizeTable = (index, field, val) => {
        const newTable = [...sizeTable]
        newTable[index][field] = val
        setSizeTable(newTable)
        onChange({ type: 'sizeTable', sizeTable: newTable })
    }

    const addRow = () => {
        const newTable = [...sizeTable, { size: '', chest: '', length: '', shoulder: '', sleeve: '' }]
        setSizeTable(newTable)
        onChange({ type: 'sizeTable', sizeTable: newTable })
    }

    const removeRow = (index) => {
        const newTable = sizeTable.filter((_, i) => i !== index)
        setSizeTable(newTable)
        onChange({ type: 'sizeTable', sizeTable: newTable })
    }

    const handleMeasurementsChange = (val) => {
        setMeasurements(val)
        onChange({ type: 'measurements', measurements: val })
    }

    return (
        <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
                <Ruler className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Size Chart (Optional)</h3>
            </div>

            <div className="flex gap-4 mb-4">
                <Button 
                    type="button"
                    variant={chartType === 'measurements' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => {
                        setChartType('measurements')
                        onChange({ type: 'measurements', measurements })
                    }}
                >
                    Simple Measurements
                </Button>
                <Button 
                    type="button"
                    variant={chartType === 'sizeTable' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => {
                        setChartType('sizeTable')
                        onChange({ type: 'sizeTable', sizeTable })
                    }}
                >
                    Size Table
                </Button>
            </div>

            {chartType === 'measurements' ? (
                <div>
                    <Label>Measurements (in inches)</Label>
                    <Textarea 
                        value={measurements}
                        onChange={(e) => handleMeasurementsChange(e.target.value)}
                        placeholder="e.g.,&#10;Chest: 42&quot;&#10;Length: 28&quot;&#10;Shoulder: 18&quot;&#10;Sleeve: 25&quot;"
                        rows={4}
                        className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter measurements as text. This will be displayed on the product page.</p>
                </div>
            ) : (
                <div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Chest (in)</TableHead>
                                    <TableHead>Length (in)</TableHead>
                                    <TableHead>Shoulder (in)</TableHead>
                                    <TableHead>Sleeve (in)</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sizeTable.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <Input 
                                                value={row.size} 
                                                onChange={(e) => updateSizeTable(index, 'size', e.target.value)}
                                                placeholder="S"
                                                className="w-16"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                value={row.chest} 
                                                onChange={(e) => updateSizeTable(index, 'chest', e.target.value)}
                                                placeholder='40"'
                                                className="w-20"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                value={row.length} 
                                                onChange={(e) => updateSizeTable(index, 'length', e.target.value)}
                                                placeholder='28"'
                                                className="w-20"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                value={row.shoulder} 
                                                onChange={(e) => updateSizeTable(index, 'shoulder', e.target.value)}
                                                placeholder='18"'
                                                className="w-20"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                value={row.sleeve} 
                                                onChange={(e) => updateSizeTable(index, 'sleeve', e.target.value)}
                                                placeholder='25"'
                                                className="w-20"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(index)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addRow} className="mt-3">
                        <Plus className="h-4 w-4 mr-2" /> Add Size
                    </Button>
                </div>
            )}
        </div>
    )
}

export default SizeChartBuilder