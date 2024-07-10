import React, { createContext, useEffect, useState } from "react";
// import all_product from '../Components/Assets/all_product'


export const ShopContext = createContext(null);

const getDefaultCart = ()=>{
    let cart = {};
    for (let index = 0; index < 300+1; index++) {
        cart[index] = 0;
    }
    return cart;
}

const ShopContextProvider = (props) =>{

    const [all_product, setAll_Product] = useState([]);
    const [cartItems, setCartItems] = useState(getDefaultCart());

    useEffect(()=>{
        fetch('http://localhost:4000/allproducts')
        .then((response)=>response.json())
        .then((data)=>setAll_Product(data))

        if(localStorage.getItem('auth-token')){
            fetch('http://localhost:4000/getcart',{
                method:'POST',
                headers:{
                    Accept:'application/form-data',
                    'auth-token': `${localStorage.getItem('auth-token')}`,
                    'Content-Type':'application/json',
                },
                body:"",
            }).then((response)=>response.json())
            .then((data)=>setCartItems(data));
        }
    },[localStorage.getItem('auth-token')])

    // useEffect(() => {
    //     const fetchProductsAndCart = async () => {
    //         const productsResponse = await fetch('http://localhost:4000/allproducts');
    //         const productsData = await productsResponse.json();
    //         setAll_Product(productsData);
    
    //         if (localStorage.getItem('auth-token')) {
    //             const cartResponse = await fetch('http://localhost:4000/getcart', {
    //                 method: 'POST',
    //                 headers: {
    //                     'Content-Type': 'application/json',
    //                     'auth-token': localStorage.getItem('auth-token'),
    //                 },
    //                 body: JSON.stringify({}),
    //             });
    //             const cartData = await cartResponse.json();
    //             setCartItems(cartData);
    //         } else {
    //             setCartItems(getDefaultCart());
    //         }
    //     };
    
    //     fetchProductsAndCart();
    // }, [localStorage.getItem('auth-token')]);

    // const addToCart = async (itemId) => {
    //     setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
    //     if (localStorage.getItem('auth-token')) {
    //         const response = await fetch('http://localhost:4000/addtocart', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'auth-token': localStorage.getItem('auth-token'),
    //             },
    //             body: JSON.stringify({ itemId }),
    //         });
    //         const data = await response.json();
    //         if (!data.success) {
    //             console.error(data.error);
    //         }
    //     }
    // };
    
    // const removeFromCart = async (itemId) => {
    //     setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
    //     if (localStorage.getItem('auth-token')) {
    //         const response = await fetch('http://localhost:4000/removefromcart', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'auth-token': localStorage.getItem('auth-token'),
    //             },
    //             body: JSON.stringify({ itemId }),
    //         });
    //         const data = await response.json();
    //         if (!data.success) {
    //             console.error(data.error);
    //         }
    //     }
    // };
    
    const addToCart = (itemId) => {
        setCartItems((prev)=>({...prev,[itemId]:prev[itemId]+1}));
        if(localStorage.getItem('auth-token')) {
            fetch('http://localhost:4000/addtocart', {
                method:'POST',
                headers:{
                    Accept:'application/form-data',
                    'auth-token':`${localStorage.getItem('auth-token')}`,
                    'Content-Type':'application/json',
                },
                body:JSON.stringify({"itemId":itemId})
            })
            .then((response)=>response.json())
            .then((data)=>console.log(data));
        }
    }

    const removeFromCart = (itemId) => {
        setCartItems((prev)=>({...prev,[itemId]:prev[itemId]-1}));
        if(localStorage.getItem('auth-token')){
            fetch('http://localhost:4000/removefromcart', {
                method:'POST',
                headers:{
                    Accept:'application/form-data',
                    'auth-token':`${localStorage.getItem('auth-token')}`,
                    'Content-Type':'application/json',
                },
                body:JSON.stringify({"itemId":itemId})
            })
            .then((response)=>response.json())
            .then((data)=>console.log(data));
        }
    }

    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for(const item in cartItems)
        {
            if(cartItems[item]>0)
            {
                let itemInfo = all_product.find((product)=>product.id===Number(item));
                totalAmount +=itemInfo.new_price * cartItems[item];
            }
            
        }
        return totalAmount;
    }
    const getTotalCartItems = () => {
        let totalItem = 0;
        for(const item in cartItems)
        {
            if(cartItems[item]>0)
            {
                totalItem += cartItems[item];
            }
        }
        return totalItem;
    }

    const handleCheckout = async () => {
        if (localStorage.getItem('auth-token')) {
            const totalAmount = getTotalCartAmount();
            // const user = JSON.parse(localStorage.getItem('user'));
            const user = JSON.parse(localStorage.getItem('user'));
            const response = await fetch('http://localhost:4000/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: totalAmount,
                    name: user.name,
                    // firstName: user.firstName,
                    // lastName: user.lastName,
                    email: user.email,
                    cartData: user.cartData,
                    // phone: user.phone,
                }),
            });
            const data = await response.json();
            if (data.success) {
                window.snap.pay(data.transactionId);  // Assuming you are using Snap for client-side payment
            } else {
                console.error(data.error);
            }
        } else {
            console.log("User not authenticated");
        }
    };

    const saveCart = async () => {
        if (localStorage.getItem('auth-token')) {
            await fetch('http://localhost:4000/savecart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': localStorage.getItem('auth-token'),
                },
                body: JSON.stringify(cartItems),
            });
        }
    };
    
    const logout = () => {
        saveCart().then(() => {
            localStorage.removeItem('auth-token');
            localStorage.removeItem('user');
            // Tambahkan logika logout lainnya di sini
        });
    };

    const contextValue = {getTotalCartItems, getTotalCartAmount, all_product, cartItems, addToCart, removeFromCart, handleCheckout,saveCart,logout};
    return (
        <ShopContext.Provider value={contextValue}>
            {props.children}
        </ShopContext.Provider>
    )
}

export default ShopContextProvider;