import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Tooltip,
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Button,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Snackbar,
    Alert,
    Menu,
    ListItemText,
    ListItemIcon,
    TextField,
    CircularProgress
} from '@mui/material';
import { Pagination } from 'antd';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalPoliceOutlinedIcon from '@mui/icons-material/LocalPoliceOutlined';
import Navbar from './Navbar';
import { v4 as uuidv4 } from 'uuid';
import { toast, ToastContainer } from 'react-toastify';
import SearchBar from './SearchBar';


export const CustomerContext = React.createContext()
const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [openLicenseModal, setOpenLicenseModal] = useState(false);
    const [licenseCount, setLicenseCount] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(null);
    const pageSize = 3  ;  // Set the number of items per page
    const [searchText, setSearchText] = useState('');

    const apiUrl = import.meta.env.VITE_APP_LAGO_BACKEND
    const apiKey = import.meta.env.VITE_APP_GETLAGO_API_KEY


    const openMenu = Boolean(anchorEl);



    const fetchCustomers = async (page) => {
        setLoading(true);
        try {
            const response = await fetch(
                `${apiUrl}/customers?per_page=${pageSize}&page=${page}`,
                { headers: { Authorization: `Bearer ${apiKey}` } }
            );
            const data = await response.json();
            const updatedCustomers = await Promise.all(
                data.customers.map(async (customer) => {
                    // Fetch subscription data for each customer
                    const subscriptionResponse = await fetch(
                        `${apiUrl}/subscriptions?external_customer_id=${customer.external_id}`,
                        { headers: { Authorization: `Bearer ${apiKey}` } }
                    );
                    const subscriptionData = await subscriptionResponse.json();
                    // Determine if the plan is allocated based on subscriptions
                    customer.isPlanAllocated = subscriptionData.subscriptions.length > 0;

                    return customer;
                })
            );
            console.log("Updated customer " + JSON.stringify(updatedCustomers))
            setCustomers(updatedCustomers);
            setTotalPages(data.meta.total_count);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log("Customers "+Math.ceil(customers.length/pageSize) + "  "+searchText)
    },[customers])




    const onPageChange = (page) => {
        setCurrentPage(page);
    };

    useEffect(() => {
        if(searchText.length === 0)
        fetchCustomers(currentPage);
    }, [currentPage]);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await fetch(`${apiUrl}/plans`, {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                    },
                });
                const data = await response.json();
                setPlans(data.plans || []);
            } catch (error) {
                console.error('Error fetching plans:', error);
            }
        };
        fetchPlans();
    }, []);

    const getTotalLicenses = (metadata) => {

        const totalLicensesField = metadata.find(item => item.key === 'total_licenses');

        return totalLicensesField ? parseInt(totalLicensesField.value) : 'No Plan allocated yet';
    };

    const handleMenuClick = (event, customer) => {
        setAnchorEl(event.currentTarget);
        console.log("Customer Object " + JSON.stringify(customer))
        setSelectedCustomer(prev => customer);
    };

    useEffect(() => {
        if (selectedCustomer) {
            isUserSubscribed(selectedCustomer);
            console.log(" isUserSubscribed " + isSubscribed)
        }
    }, [selectedCustomer]);

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleOpenModal = () => {
        setOpenModal(true);
        handleMenuClose();
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedPlan('');
    };

    const handleOpenLicenseModal = () => {
        setOpenLicenseModal(true);
        handleMenuClose();
    };

    const handleCloseLicenseModal = () => {
        setOpenLicenseModal(false);
        setLicenseCount('');
    };


    const handleAllocateLicenses = async () => {
        if (!selectedCustomer || !licenseCount) {
            setSnackbarMessage("Please enter the number of licenses to add.");
            setSnackbarOpen(true);
            return;
        }

        const currentTotalLicenses = getTotalLicenses(selectedCustomer.metadata);
        const updatedTotalLicenses = (currentTotalLicenses + parseInt(licenseCount)).toString();
        // console.log("customer "+ JSON.stringify(selectedCustomer.metadata.find((item) => item.key === 'total_licenses')))
        const customerPayload = {
            customer: {
                external_id: selectedCustomer.external_id,
                metadata: [
                    {
                        id: selectedCustomer.metadata.find((item) => item.key === 'total_licenses').lago_id,
                        key: 'total_licenses',
                        value: updatedTotalLicenses.toString(),
                        display_in_invoice: true,
                    },
                ],
                taxes: [],
            },
        };

        try {
            const customerResponse = await fetch(`${apiUrl}/customers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(customerPayload),
            });

            //Before constructing the eventPayload , we need the associated subscription_id and Plan_code

            const subscriptionResponse = await fetch(
                `${apiUrl}/subscriptions?external_customer_id=${selectedCustomer.external_id}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`,
                    },
                }
            );

            // Parse JSON response
            const subscriptionData = await subscriptionResponse.json();
            console.log("Subscription response:", subscriptionData, selectedCustomer.external_id);

            // Extract subscription and plan details
            if (subscriptionData.subscriptions.length === 0) {
                // If the user does not have any active subscriptions , ask the user to assign a plan
            }
            const customerSubscription = subscriptionData.subscriptions[0]; // Assuming only one subscription is needed
            const customerPlanCode = customerSubscription?.plan_code;

            // Construct event payload

            var planResponse = await fetch(`${apiUrl}/plans/${customerPlanCode}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`
                }
            })
            const customerPlan = await planResponse.json()
            const billableMetricCode = customerPlan.plan.charges[0].billable_metric_code
            const eventPayload = {
                event: {
                    transaction_id: uuidv4(),
                    external_subscription_id: customerSubscription.external_id,
                    code: billableMetricCode,
                    properties: {
                        licenses: parseInt(licenseCount),
                    },
                },
            };



            console.log("event Payload " + eventPayload)

            await fetch(`${apiUrl}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(eventPayload),
            });

            if (customerResponse.ok) {
                toast.success('Licenses allocated successfully')
                // setSnackbarMessage("Licenses allocated successfully!");
            } else {
                toast.error('Failed to allocate licenses. Please try again.')
                // setSnackbarMessage("Failed to allocate licenses. Please try again.");
            }
            // setSnackbarOpen(true);
            handleCloseLicenseModal();
        } catch (error) {
            console.error("Error allocating licenses:", error);
            toast.error('An error occurred. Please try again.')
            // setSnackbarMessage("An error occurred. Please try again.");
            // setSnackbarOpen(true);
        }
    };

    const isUserSubscribed = async (customer) => {
        try {
            console.log("Selected customer " + customer.external_id)
            const subscriptionResponse = await fetch(
                `${apiUrl}/subscriptions?external_customer_id=${customer.external_id}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`,
                    },
                }
            );

            // Parse JSON response
            const subscriptionData = await subscriptionResponse.json();
            console.log("Subscription response:", subscriptionData, customer.external_id);

            // Extract subscription and plan details
            console.log(subscriptionData.subscriptions)
            if (subscriptionData.subscriptions.length == 0) {
                setIsSubscribed(false)
                return false
            }
            setIsSubscribed(true)
            return true
        }
        catch (error) {
            toast.error('Something went wrong')
        }
    }

    const handleOpenCustomerPortal = async (externalId) => {
        try {
            const response = await fetch(`${apiUrl}/customers/${externalId}/portal_url`, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            });
            const data = await response.json();
            const portalUrl = data.customer.portal_url;


            if (portalUrl) {
                window.open(portalUrl, '_blank');
            }

        } catch (error) {
            console.error("Error fetching customer portal URL:", error);
        }
    };


    const handleAllocatePlan = async () => {
        if (!selectedCustomer || !selectedPlan) {
            setSnackbarMessage("Please select a plan.");
            setSnackbarOpen(true);
            return;
        }
        const uniqueExternalId = uuidv4();
        const subscriptionPayload = {
            subscription: {
                external_customer_id: selectedCustomer.external_id,
                plan_code: selectedPlan,
                external_id: uniqueExternalId,
            },
        };

        try {
            var response = await fetch(`${apiUrl}/subscriptions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(subscriptionPayload),
            });
            const statusCode = response.status
            response = await response.json()

            if (statusCode === 200) {
                toast.success('Plan allocation successful')
            }
            else if (statusCode === 401) {
                toast.error("Unauthorized")
            }
            else if (statusCode === 422 && response.error_details && response.error_details.currency) {
                toast.error('Customer’s currency and the plan’s one of are different. To create this subscription, please select another plan.')
            }
            else {
                toast.error('Something went wrong ')
            }
            // setSnackbarOpen(true);
            handleCloseModal();
        } catch (error) {
            console.error("Error allocating plan:", error);
            toast.error("An error occured. Please try again.")
            // setSnackbarMessage("An error occurred. Please try again.");
            // setSnackbarOpen(true);
        }
    };





    return (
        <>
            <ToastContainer />
            <Navbar />
            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center">
                    <CircularProgress />
                </Box>

            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 2 }} className='mt-12'>
                    <CustomerContext.Provider value={{ setCustomers, searchText, setSearchText, setCurrentPage }}>
                        <SearchBar />
                    </CustomerContext.Provider>


                    {searchText && customers && customers.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize).map((customer) => (
                        <Card
                            key={customer.lago_id}
                            sx={{
                                width: 700,
                                maxWidth: 600,
                                marginBottom: 1,
                                padding: 1,
                                boxShadow: 2,
                                position: 'relative',
                                transition: 'all 0.3s',
                                '&:hover': {
                                    transform: 'scale(1.02)',
                                    boxShadow: 4,
                                },
                            }}
                        >
                            <CardContent sx={{ padding: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {customer.name}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {new Date(customer.created_at).toLocaleDateString()}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Tooltip title="Total licenses allocated to this customer" arrow>
                                            <Typography variant="body2" color="textSecondary">
                                                Total Licenses:
                                            </Typography>
                                        </Tooltip>
                                        <Typography variant="body2">
                                            {customer.isPlanAllocated ? getTotalLicenses(customer.metadata) : "No Plans allocated yet"}

                                        </Typography >
                                    </Box>

                                    <IconButton onClick={(e) => handleMenuClick(e, customer)} aria-label="more options" sx={{ padding: 0 }}>
                                        <MoreVertIcon />
                                    </IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    ))

                    }
                    {!searchText && customers && customers.map((customer) => (
                        <Card
                            key={customer.lago_id}
                            sx={{
                                width: 700,
                                maxWidth: 600,
                                marginBottom: 1,
                                padding: 1,
                                boxShadow: 2,
                                position: 'relative',
                                transition: 'all 0.3s',
                                '&:hover': {
                                    transform: 'scale(1.02)',
                                    boxShadow: 4,
                                },
                            }}
                        >
                            <CardContent sx={{ padding: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {customer.name}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {new Date(customer.created_at).toLocaleDateString()}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Tooltip title="Total licenses allocated to this customer" arrow>
                                            <Typography variant="body2" color="textSecondary">
                                                Total Licenses:
                                            </Typography>
                                        </Tooltip>
                                        <Typography variant="body2">
                                            {customer.isPlanAllocated ? getTotalLicenses(customer.metadata) : "No Plans allocated yet"}

                                        </Typography >
                                    </Box>

                                    <IconButton onClick={(e) => handleMenuClick(e, customer)} aria-label="more options" sx={{ padding: 0 }}>
                                        <MoreVertIcon />
                                    </IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    ))

                    }

                    {customers && customers.length!==0 ? (
                        <Pagination
                        showQuickJumper
                        current={currentPage}
                        // total={searchText.length>0 ?   Math.ceil(customers.length/pageSize) : totalPages }
                        total={totalPages}
                        pageSize={pageSize}
                        onChange={onPageChange}
                    />
                    )
                    : (
                        <div>
                            No results found
                        </div>
                    )
                    }
                    
                </Box>
            )
            }


            <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleMenuClose}
                PaperProps={{
                    elevation: 1,
                    sx: {
                        boxShadow: 6,
                        padding: 1,
                        borderRadius: 2,
                    },
                }}
            >
                <MenuItem
                    onClick={() => handleOpenCustomerPortal(selectedCustomer.external_id)}
                    className="flex items-center space-x-2"
                >
                    <OpenInNewIcon />
                    <span>Open Customer portal</span>
                </MenuItem>
                <MenuItem onClick={handleOpenModal}>
                    <ListItemIcon>
                        <AssignmentIcon />
                    </ListItemIcon>
                    <ListItemText>Assign Plan</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleOpenLicenseModal}>
                    <ListItemIcon>
                        <LocalPoliceOutlinedIcon />
                    </ListItemIcon>
                    <ListItemText>Assign Licenses</ListItemText>
                </MenuItem>
            </Menu>

            <Dialog
                open={openModal}
                onClose={handleCloseModal}
                maxWidth="md"  // Adjust the modal size
                fullWidth  // Make the dialog span the full width within maxWidth
                sx={{
                    '& .MuiDialog-paper': {
                        borderRadius: 4,
                        padding: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)', // Slight opacity
                    },
                }}
            >
                <DialogTitle>Allocate Plan to {selectedCustomer?.name}</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth>
                        <InputLabel id="plan-select-label">Plan</InputLabel>
                        <Select
                            labelId="plan-select-label"
                            value={selectedPlan}
                            onChange={(e) => setSelectedPlan(e.target.value)}
                            label="Plan"
                        >
                            {plans.map((plan) => (
                                <MenuItem key={plan.lago_id} value={plan.code}>
                                    {plan.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleAllocatePlan} color="primary">
                        Allocate Plan
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity="info">
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            {openModal && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(5px)',
                        zIndex: 1200,
                    }}
                />
            )}

            {/* "Assign Licenses" Modal */}
            {isSubscribed ? (
                <Dialog open={openLicenseModal} onClose={handleCloseLicenseModal} maxWidth="md" fullWidth>
                    <DialogTitle>Allocate Licenses to {selectedCustomer?.name}</DialogTitle>
                    <DialogContent>
                        {selectedCustomer ? (
                            <Typography variant="body2">
                                Total Licenses: {getTotalLicenses(selectedCustomer.metadata)}
                            </Typography>
                        ) : (
                            <Typography variant="body2">No customer selected</Typography>
                        )}

                        <TextField
                            fullWidth
                            label="Add additional Number of Licenses Needed"
                            type="number"
                            value={licenseCount}
                            onChange={(e) => setLicenseCount(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseLicenseModal} color="primary">
                            Cancel
                        </Button>
                        <Button onClick={handleAllocateLicenses} color="primary">
                            Allocate Licenses
                        </Button>
                    </DialogActions>
                </Dialog>
            ) : (
                <Dialog open={openLicenseModal} onClose={handleCloseLicenseModal} maxWidth="md" fullWidth>
                    <DialogTitle>Kindly assign a plan to the customer and then assign licenses</DialogTitle>
                </Dialog>
            )
            }


            {/* Snackbar for Notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity="info">
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </>
    );
};

export default CustomerList;

