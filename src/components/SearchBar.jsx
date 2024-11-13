import React, { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { CustomerContext } from './customerList';
// import { XIcon } from '@heroicons/react/solid'; 

function SearchBar() {
    const [allCustomers, setAllCustomers] = useState([]);
    const { setCustomers , searchText, setSearchText, setCurrentPage } = useContext(CustomerContext);
    const apiUrl = import.meta.env.VITE_APP_LAGO_BACKEND;
    const apiKey = import.meta.env.VITE_APP_GETLAGO_API_KEY;


    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const customerList = await fetch(`${apiUrl}/customers?per_page=10000&page=1`, {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                    },
                }).then((res) => res.json());

                setAllCustomers(customerList.customers);
            } catch (error) {
                toast.error('Something went wrong');
            }
        };

        fetchCustomer();
    }, []);


    const findMatchingEntries = (e) => {
        setCurrentPage(1)
        const query = e.target.value;
        setSearchText(query);

        const filteredCustomers = allCustomers.filter((customer) =>
            customer.name.toLowerCase().startsWith(query.toLowerCase()) || customer.external_id.startsWith(query)
        );
        console.log("Filtered "+filteredCustomers.length)

        setCustomers(filteredCustomers);
    };


    const clearSearch = () => {
        setSearchText('');
        setCustomers(allCustomers);
    };

    return (
        <div className="flex justify-center items-center w-full mt-4">
            <div className="relative w-full max-w-md">
                <input
                    type="text"
                    value={searchText}
                    onChange={(e) => findMatchingEntries(e)}
                    placeholder="Search customers"
                    className="w-full p-3 pl-4 pr-10 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchText && (
                    <div
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SearchBar;
