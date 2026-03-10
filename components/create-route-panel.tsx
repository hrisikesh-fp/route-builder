"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, ArrowRight } from "lucide-react"

const HubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2 14V4L8 2L14 4V14H2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M5 7H11M5 10H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

interface CreateRoutePanelProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateRoutePanel({ isOpen, onClose }: CreateRoutePanelProps) {
  return (
    <div
      className={`fixed right-0 z-[999] bg-[#171717] flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{
        top: "54px",
        height: "calc(100vh - 54px)",
        width: "450px",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.1)]">
        <h2
          style={{
            flex: "1 0 0",
            color: "#FFF",
            fontSize: "20px",
            fontWeight: 600,
            lineHeight: "100%",
          }}
        >
          Create New Route
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Route Name */}
        <div className="space-y-2">
          <Label htmlFor="route-name" className="text-white text-sm font-medium">
            Route Name
          </Label>
          <Input
            id="route-name"
            placeholder="Enter Route Name"
            className="h-9 bg-[#0A0A0A] border-[rgba(255,255,255,0.15)] text-white placeholder:text-[#737373] rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hub-select" className="text-white text-sm font-medium">
            Select a Zone
          </Label>
          <Select>
            <SelectTrigger
              id="hub-select"
              className="w-full h-9 bg-[#0A0A0A] border-[rgba(255,255,255,0.15)] text-white rounded-lg gap-2 justify-between"
            >
              <div className="flex items-center gap-2">
                <HubIcon />
                <SelectValue placeholder="Select" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buffalo-west">Buffalo West</SelectItem>
              <SelectItem value="buffalo-east">Buffalo East</SelectItem>
              <SelectItem value="buffalo-north">Buffalo North</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Footer with CTA Button */}
      <div className="p-6 border-t border-[rgba(255,255,255,0.1)]">
        <Button className="w-full h-12 bg-[#A3A3A3] hover:bg-[#8C8C8C] text-[#171717] rounded-lg font-medium gap-2">
          Start Creating a Route
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
