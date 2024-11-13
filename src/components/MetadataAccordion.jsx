import React, { useState } from 'react';

const MetadataAccordion = ({ metadata, onMetadataChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputFields, setInputFields] = useState([{ key: '', value: '', displayInInvoice: false }]);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  const addInputField = () => {
    setInputFields([...inputFields, { key: '', value: '', display_in_invoice: false }]);
  };

  const handleInputChange = (index, field, value) => {
    const newInputFields = [...inputFields];
    newInputFields[index][field] = value;
    setInputFields(newInputFields);
    onMetadataChange(
      newInputFields.map(item => ({
        key: item.key,
        value: item.value,
        display_in_invoice: item.displayInInvoice,
      }))
    );
    
  };

  const removeInputField = (index) => {
    const newInputFields = inputFields.filter((_, i) => i !== index);
    setInputFields(newInputFields);
    onMetadataChange(
      newInputFields.map(item => ({
        key: item.key,
        value: item.value,
        display_in_invoice: item.displayInInvoice,
      })).filter(item => item.key && item.value)
    );
  };

  return (
    <div className="border rounded-lg mb-4">
      <button
        type="button"
        className="w-full text-left p-4 bg-gray-200 rounded-lg focus:outline-none flex items-center justify-between"
        onClick={toggleAccordion}
      >
        <h2 className="font-semibold">Metadata</h2>
        <span className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`}>➔</span>
      </button>
      {isOpen && (
        <div className="p-4">
          {inputFields.map((field, index) => (
            <div key={index} className="flex mb-3 items-center">
              <input
                type="text"
                placeholder="Key"
                value={field.key}
                onChange={(e) => handleInputChange(index, 'key', e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-lg p-2.5 w-1/3 mr-2"
              />
              <input
                type="text"
                placeholder="Value"
                value={field.value}
                onChange={(e) => handleInputChange(index, 'value', e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-lg p-2.5 w-1/3 mr-2"
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  value={field.displayInInvoice}
                  onChange={(e) => handleInputChange(index, 'displayInInvoice', e.target.checked)}
                  className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
                />
                <label className="ml-2 text-sm font-medium">Include in Invoice</label>
              </div>
              {inputFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInputField(index)}
                  className="ml-2 text-red-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addInputField}
            className="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg px-4 py-2 mt-2"
          >
            Add Another Metadata
          </button>
        </div>
      )}
    </div>
  );
};

export default MetadataAccordion;
