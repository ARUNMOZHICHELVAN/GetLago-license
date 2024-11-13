import React, { useState } from 'react';
import MetadataAccordion from './MetadataAccordion';
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './Navbar';
import { CountryCodes } from '../enum/countries'
import { CurrencyEnum } from '../enum/currency';


const CustomerForm = () => {
  const [customerData, setCustomerData] = useState({
    customerType: 'company',
    externalId: uuidv4(),
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    legalName: '',
    legalNumber: '',
    taxIdentificationNumber: '',
    url: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    zipcode: '',
    city: '',
    state: '',
    country: '',
    shippingAddress: {
      useBillingAddress: false,
      addressLine1: '',
      addressLine2: '',
      zipcode: '',
      city: '',
      state: '',
      country: '',
    },
    currency: '',
    metadata: [],
    paymentProvider: '',
    providerCustomerId: '',
    createCustomerInStripe: false,
    paymentMethods: {
      card: false,
      link: false,
      sepa_debit: false,
      us_bank_account: false,
      bacs_debit: false,
    },
  });

  const [shippingAddress, setShippingAddress] = useState({
    useBillingAddress: false,
    addressLine1: '',
    addressLine2: '',
    zipcode: '',
    city: '',
    state: '',
    country: '',
  })

  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isPaymentAccordionOpen, setIsPaymentAccordionOpen] = useState(false);
  const apiUrl = import.meta.env.VITE_APP_LAGO_BACKEND
  const apiKey = import.meta.env.VITE_APP_GETLAGO_API_KEY


  const handleChange = (e) => {
    const { name, value } = e.target
    setCustomerData((prevData) => ({
      ...prevData,
      [name]: value
    }))
    
  }

  const handleShippingAddressChange = (e) => {
    const { name, value } = e.target
    setShippingAddress((prevData) => ({
      ...prevData,
      [name]: value
    }))
    
  }



  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setCustomerData((prevData) => ({
      ...prevData,
      [name]: checked,
    }));
  };

  const handlePaymentMethodChange = (e) => {
    const { name, checked } = e.target;
    setCustomerData((prevData) => ({
      ...prevData,
      paymentMethods: {
        ...prevData.paymentMethods,
        [name]: checked,
      },
    }));
  };

  const handleShippingAddressToggle = () => {
    setCustomerData((prevData) => ({
      ...prevData,
      shippingAddress: {
        ...prevData.shippingAddress,
        useBillingAddress: !prevData.shippingAddress.useBillingAddress,
      },
    }));
  };

  const handleMetadataChange = (newMetadata) => {
    setCustomerData((prevData) => ({
      ...prevData,
      metadata: newMetadata,
    }));
    
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = { customer: {} };
    formData.customer.external_id = customerData.externalId;


    // Build formData based on fields
    if (customerData.customerType) formData.customer.customer_type = customerData.customerType;
    if (customerData.name) formData.customer.name = customerData.name;
    if (customerData.firstName) formData.customer.first_name = customerData.firstName;
    if (customerData.lastName) formData.customer.last_name = customerData.lastName;
    if (customerData.email) formData.customer.email = customerData.email;
    if (customerData.legalName) formData.customer.legal_name = customerData.legalName;
    if (customerData.legalNumber) formData.customer.legal_number = customerData.legalNumber;
    if (customerData.taxIdentificationNumber) formData.customer.tax_identification_number = customerData.taxIdentificationNumber;
    if (customerData.url) formData.customer.url = customerData.url;
    if (customerData.phone) formData.customer.phone = customerData.phone;
    if (customerData.currency) formData.customer.currency = customerData.currency;

    // Add billing address if present
    if (customerData.addressLine1 || customerData.city || customerData.state || customerData.zipcode || customerData.country) {
      formData.customer.address_line1 = customerData.addressLine1
      formData.customer.address_line1 = customerData.addressLine2
      formData.customer.zip_code = customerData.zipcode
      formData.customer.city = customerData.city
      formData.customer.state = customerData.state
      formData.customer.country = customerData.country
    }

    // Add shipping address if it's being used
    if (shippingAddress.useBillingAddress) {
      formData.customer.shipping_address = {
        address_line1: customerData.addressLine1,
        address_line2: customerData.addressLine2,
        zip_code: customerData.zipcode,
        city: customerData.city,
        state: customerData.state,
        country: customerData.country
      };
    } else if (shippingAddress.addressLine1) {
      formData.customer.shipping_address = {
        address_line1: shippingAddress.addressLine1,
        address_line2: shippingAddress.addressLine2,
        zip_code: shippingAddress.zipcode,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: shippingAddress.country
      };
    }

    // Add metadata if present
    if (customerData.metadata.length > 0) {
      formData.customer.metadata = customerData.metadata.map(meta => ({
        key: meta.key,
        value: meta.value,
        display_in_invoice: meta.display_in_invoice,
      }));
    }

    // Handle licenses metadata
    const totalLicenses = customerData.numberOfLicenses ? customerData.numberOfLicenses : 0;
    formData.customer.metadata = formData.customer.metadata || [];
    formData.customer.metadata.push({
      key: "total_licenses",
      value: totalLicenses,
    });
    formData.customer.metadata.push({
      key: "used_licenses",
      value: 0,
    });

    if (customerData.paymentProvider === 'stripe') {
      const billingConfig = {
        payment_provider: "stripe",
        sync: true,
        sync_with_provider: true,
      };

      if (customerData.createCustomerInStripe) {
        formData.customer.billing_configuration = { ...billingConfig };
      } else {
        billingConfig.provider_customer_id = customerData.providerCustomerId;
        formData.customer.billing_configuration = { ...billingConfig };
      }

      // Add payment methods if stripe is selected
      const providerPaymentMethods = [];
      
      if (customerData.paymentMethods.link){
        providerPaymentMethods.push("card");
        providerPaymentMethods.push("link");
      }
      else if(customerData.paymentMethods.card) providerPaymentMethods.push("card")
      if (customerData.paymentMethods.sepa_debit) providerPaymentMethods.push("sepa_debit");
      if (customerData.paymentMethods.us_bank_account) providerPaymentMethods.push("us_bank_account");
      if (customerData.paymentMethods.bacs_debit) providerPaymentMethods.push("bacs_debit");

      if (providerPaymentMethods.length > 0) {
        formData.customer.billing_configuration.provider_payment_methods = providerPaymentMethods;
      }
    }

    console.log(formData)


    try {
      const response = await fetch(`${apiUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        toast.error(response.error)
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      toast.success('Customer created successfully')
      console.log('Success:', data);
    } catch (error) {
      toast.error('Error:', error)
      console.error('Error:', error);
    }
  };

  return (
    <>
      <ToastContainer />
      <Navbar />
      <form className="max-w-2xl mx-auto" onSubmit={handleSubmit}>

        <h1 className="text-xl font-bold mb-4">Add a Customer</h1>
        <div className="mb-5">
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Customer Type</label>
          <select
            name="customerType"
            value={customerData.customerType}
            onChange={handleChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
          >
            <option value="company">company</option>
            <option value="individual">individual</option>
          </select>
        </div>
        <div className="mb-5">
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Customer Name</label>
          <input
            type="text"
            name="name"
            value={customerData.name}
            onChange={handleChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
            placeholder="Type a name"
            required
          />
        </div>
        <div className="mb-5">
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">First Name</label>
          <input
            type="text"
            name="firstName"
            value={customerData.firstName}
            onChange={handleChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
            placeholder="Type a first name"
          />
        </div>
        <div className="mb-5">
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={customerData.lastName}
            onChange={handleChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
            placeholder="Type a last name"
          />
        </div>

        {/* <div className="mb-5">
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
          <input
            type="email"
            name="email"
            value={customerData.email}
            onChange={handleChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
            placeholder="Type an email"
            required
          />
        </div> */}



        <div className="border rounded-lg mb-4">
          <button type="button" className="w-full text-left p-4 bg-gray-200 rounded-lg focus:outline-none flex items-center justify-between" onClick={() => setIsBillingOpen(!isBillingOpen)}>
            <h2 className="font-semibold">Billing Information</h2>
            <span className={`transform transition-transform ${isBillingOpen ? 'rotate-90' : ''}`}>➔</span>
          </button>
          {isBillingOpen && (
            <div className="p-4">
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Currency</label>
                <select
                  type="text"
                  name="currency"
                  value={customerData.currency}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                  placeholder="Search or select a currency"
                >
                  {Object.entries(CurrencyEnum).map(([code, name]) => (
                    <option name={name} key={name} value={name} >
                      {name}
                    </option>
                  ))}
                  </select>
              </div>
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Legal Name</label>
                <input
                  type="text"
                  name="legalName"
                  value={customerData.legalName}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                  placeholder="Type a legal name"
                />
              </div>
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Legal Number</label>
                <input
                  type="text"
                  name="legalNumber"
                  value={customerData.legalNumber}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                  placeholder="Type a legal number"
                />
              </div>
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Tax Identification Number</label>
                <input
                  type="text"
                  name="taxIdentificationNumber"
                  value={customerData.taxIdentificationNumber}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                  placeholder="Type a tax identification number"
                />
              </div>

              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                <input
                  type="email"
                  name="email"
                  value={customerData.email}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                  placeholder="Type an email"
                />
                <p className='text-sm'>Leave this field blank if you prefer not to send invoices to this customer by email. To send an email to multiple recipients, please separate emails with a comma.</p>

              </div>

              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">URL</label>
                <input
                  type="text"
                  name="url"
                  value={customerData.url}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                  placeholder="Type a website URL"
                />
              </div>

              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={customerData.phone}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                  placeholder="Type a  phone number"
                />
              </div>
              <div className="mb-5">
                <p className='font-bold m-5'>Billing address (Optional)</p>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Address Line 1</label>
                <input
                  type="text"
                  name="addressLine1"
                  value={customerData.addressLine1}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                  placeholder="Enter your address"
                />
              </div>
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Address Line 2</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={customerData.addressLine2}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                  placeholder="Enter your address"
                />
              </div>
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">City</label>
                <input
                  type="text"
                  name="city"
                  value={customerData.city}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                  placeholder="Enter your city"
                />
              </div>
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">State</label>
                <input
                  type="text"
                  name="state"
                  value={customerData.state}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                  placeholder="Enter your state"
                />
              </div>
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Zip Code</label>
                <input
                  type="text"
                  name="zipcode"
                  value={customerData.zipcode}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                  placeholder="Enter your zip code"
                />
              </div>
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Country</label>
                <select
                  type="text"
                  name="country"
                  value={customerData.country}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
                  placeholder="Select your country"
                >
                  {Object.entries(CountryCodes).map(([code, name]) => (
                    <option name={code} key={code} value={code} >
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-5">
                <p className='font-bold m-5'>Shipping address (Optional)</p>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="useBillingAddress"
                    checked={shippingAddress.useBillingAddress}
                    onChange={() => setShippingAddress((prev) => ({
                      ...prev,
                      useBillingAddress: !prev.useBillingAddress
                    }))}
                    className="mr-2"
                  />

                  Use the same information from the billing address
                </label>
              </div>
              <div className='mb-5'>

                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Address Line 1</label>
                <input
                  type="text"
                  name='addressLine1'
                  value={shippingAddress.addressLine1}
                  onChange={handleShippingAddressChange}
                  disabled={shippingAddress.useBillingAddress ? true : false}
                  className={`bg-gray-${shippingAddress.useBillingAddress ? "200" : "50"}  border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5`}
                  placeholder='Enter your address'
                />
              </div>

              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Address Line 2</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={shippingAddress.addressLine2}
                  onChange={handleShippingAddressChange}
                  disabled={shippingAddress.useBillingAddress ? true : false}
                  className={`bg-gray-${shippingAddress.useBillingAddress ? "200" : "50"}  border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5`}
                  placeholder="Enter your address"
                />
              </div>
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">City</label>
                <input
                  type="text"
                  name="city"
                  value={shippingAddress.city}
                  onChange={handleShippingAddressChange}
                  disabled={shippingAddress.useBillingAddress ? true : false}
                  className={`bg-gray-${shippingAddress.useBillingAddress ? "200" : "50"}  border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5`}
                  placeholder="Enter your city"
                />
              </div>
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">State</label>
                <input
                  type="text"
                  name="state"
                  value={shippingAddress.state}
                  onChange={handleShippingAddressChange}
                  disabled={shippingAddress.useBillingAddress ? true : false}
                  className={`bg-gray-${shippingAddress.useBillingAddress ? "200" : "50"}  border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5`}
                  placeholder="Enter your state"
                />
              </div>
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Zip Code</label>
                <input
                  type="text"
                  name="zipcode"
                  value={shippingAddress.zipcode}
                  onChange={handleShippingAddressChange}
                  disabled={shippingAddress.useBillingAddress ? true : false}
                  className={`bg-gray-${shippingAddress.useBillingAddress ? "200" : "50"}  border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5`}
                  placeholder="Enter your zip code"
                />
              </div>
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Country</label>
                <select
                  type="text"
                  name="country"
                  value={shippingAddress.country}
                  onChange={handleShippingAddressChange}
                  disabled={shippingAddress.useBillingAddress ? true : false}
                  className={`bg-gray-${shippingAddress.useBillingAddress ? "200" : "50"}  border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5`}
                  placeholder="Select your country"
                >
                  {Object.entries(CountryCodes).map(([code, name]) => (
                    <option name={code} key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="border rounded-lg mb-4">
          <button
            type="button"
            className="w-full text-left p-4 bg-gray-200 rounded-lg focus:outline-none flex items-center justify-between"
            onClick={() => setIsPaymentAccordionOpen(!isPaymentAccordionOpen)}
          >
            <h2 className="font-semibold"> Payment Provider  </h2>
            <span className={`transform transition-transform ${isPaymentAccordionOpen ? 'rotate-90' : ''}`}>➔</span>
          </button>
          {isPaymentAccordionOpen && (
            <div className="p-4">
              <select
                name="paymentProvider"
                value={customerData.paymentProvider}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
              >
                <option value="">Select a provider</option>
                <option value="stripe">Stripe</option>
              </select>

              {customerData.paymentProvider === "stripe" && (
                <>
                  <div className="mb-7">
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Payment Provider Customer ID</label>
                    <input
                      type="text"
                      name="providerCustomerId"
                      value={customerData.providerCustomerId}
                      onChange={handleChange}
                      disabled={customerData.createCustomerInStripe}
                      className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 ${customerData.createCustomerInStripe ? "cursor-not-allowed" : ""}`}
                      placeholder="Enter payment provider customer ID"
                    />
                  </div>
                  <div className="mb-5">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="createCustomerInStripe"
                        checked={customerData.createCustomerInStripe}
                        onChange={handleCheckboxChange}
                        className="mr-2"
                      />
                      Create automatically this customer in Stripe
                    </label>
                  </div>

                  <h2 className="text-lg font-semibold mb-2">Payment Methods</h2>

                  {/* General Payment Method section */}
                  <div className="mb-4">
                    <h3 className="font-bold mb-2">General Payment Method</h3>
                    <div className="flex gap-4">
                      {["card", "link"].map(method => (
                        <label key={method} className="flex items-center">
                          <input
                            type="checkbox"
                            name={method}
                            checked={customerData.paymentMethods[method]}
                            onChange={handlePaymentMethodChange}
                            className="mr-2"
                            disabled={method === "card" && customerData.paymentMethods.link} // Disable Card if Link is selected
                          />
                          {method === "card" ? "Card (For all currencies)" : "Link (One-click Payments)"}
                        </label>
                      ))}
                    </div>
                  </div>


                  <div>
                    <h3 className="font-bold mb-2">Localized Payment Methods</h3>
                    {["sepa_debit", "us_bank_account", "bacs_debit"].map(method => (
                      <label key={method} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          name={method}
                          checked={customerData.paymentMethods[method]}
                          onChange={handlePaymentMethodChange}
                          className="mr-2"
                        />
                        {method == "sepa_debit" ? "SEPA Debit ( For customers invoiced in EUR)" : (method == "us_bank_account" ? "US Bank Account (ACH) (For customers invoiced in USD)" : "BACS Debit (For customers invoiced in GBP)")}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}



        </div>






        <MetadataAccordion onMetadataChange={handleMetadataChange} />


        <div className="flex justify-end">
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Submit</button>
        </div>
      </form>
    </>
  );
};

export default CustomerForm;
