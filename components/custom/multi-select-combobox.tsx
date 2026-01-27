"use client"

import * as React from "react"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { Check } from "lucide-react"

interface Option {
  value: string
  label: string
}

interface MultiSelectComboboxProps {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelectCombobox({
  options,
  value,
  onChange,
  placeholder = "Select items...",
  className,
}: MultiSelectComboboxProps) {
  const anchor = useComboboxAnchor()

  const [inputValue, setInputValue] = React.useState("")

  const selectedOptions = options.filter((o) => value.includes(o.value))

  const handleValueChange = (newOptions: Option[]) => {
    onChange(newOptions.map((o) => o.value))
  }

  return (
    <Combobox
      multiple
      items={options}
      value={selectedOptions}
      onValueChange={handleValueChange}
      itemToString={(item) => item ? item.label : ""}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      filterFn={(item, search) => item.label.toLowerCase().includes(search.toLowerCase())}
    >
      <ComboboxChips ref={anchor} className={className}>
        <ComboboxValue>
          {(values) => (
            <React.Fragment>
              {values.map((item) => (
                <ComboboxChip key={item.value}>
                  {item.label}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput 
                placeholder={values.length === 0 ? placeholder : undefined} 
              />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
