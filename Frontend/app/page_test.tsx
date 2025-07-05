"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Brain } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function TestPage() {
  const [selectedEquipment, setSelectedEquipment] = useState<string>("")

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="bg-slate-800 p-4 rounded-md mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold">IRM Gemma Test</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm">Équipement IRM :</label>
            <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
              <SelectTrigger className="w-[200px] bg-slate-700">
                <SelectValue placeholder="Sélectionner l'équipement" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700">
                <SelectItem value="hyperfine-swoop">Hyperfine Swoop</SelectItem>
                <SelectItem value="chipiron-cha-1">Chipiron CHA-1</SelectItem>
                <SelectItem value="standard-generique">Standard (Générique)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-800 p-4 rounded-md">
        <h2 className="text-lg mb-4">Équipement sélectionné : 
          <span className="text-cyan-400 ml-2">
            {selectedEquipment ? selectedEquipment : "Aucun"}
          </span>
        </h2>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          Test Button
        </Button>
      </div>
    </div>
  )
}
