import { db } from "../../models/index.js";
import { responseReturn } from "../../utils/response.js";

class cartController {

    add_to_cart = async (req, res) => {
        const { userId, productId, quantity } = req.body;
    
        try {
            // ✅ Check if product already in cart
            const existingProduct = await db.Cart.findOne({
                where: { userId, productId }
            });
    
            if (existingProduct) {
                return res.status(404).json({
                    error: 'Product exists in cart'
                });
            }
    
            // ✅ Auto-remove from wishlist if present
            await db.Wishlist.destroy({
                where: { userId, productId }
            });
    
            // ✅ Add to cart
            const newCartItem = await db.Cart.create({
                userId,
                productId,
                quantity
            });
    
            return res.status(201).json({
                message: 'Added to cart successfully',
                product: newCartItem
            });
        } catch (error) {
            console.error('An Error Occurred:', error.message);
            return res.status(500).json({ error: 'Server Error!' });
        }
    };
    

    get_cart_products = async (req, res) => {
        const commissionRate = 13.5;
        const { userId } = req.params;

        try {
            const cartItems = await db.Cart.findAll({
                where: { userId },
                include: [{
                    model: db.Product,
                    include: [db.Seller]
                }]
            });

            let buy_product_item = 0;
            let calculatePrice = 0;
            let cart_product_count = 0;

            const outOfStockProduct = cartItems.filter(
                item => item.Product && item.Product.stock < item.quantity
            );

            for (const item of outOfStockProduct) {
                cart_product_count += item.quantity;
            }

            const stockProduct = cartItems.filter(
                item => item.Product && item.Product.stock >= item.quantity
            );

            for (const item of stockProduct) {
                const { quantity } = item;
                const product = item.Product;

                cart_product_count += quantity;
                buy_product_item += quantity;

                const { price, discount } = product;
                const discountedPrice = discount > 0
                    ? price - Math.floor((price * discount) / 100)
                    : price;

                calculatePrice += quantity * discountedPrice;
            }

            const groupedBySeller = {};

            for (const item of stockProduct) {
                const product = item.Product;
                const sellerId = product.sellerId;

                const discountedPrice = product.discount > 0
                    ? product.price - Math.floor((product.price * product.discount) / 100)
                    : product.price;

                const commissionPrice = discountedPrice - Math.floor((discountedPrice * commissionRate) / 100);
                const totalPrice = commissionPrice * item.quantity;

                if (!groupedBySeller[sellerId]) {
                    groupedBySeller[sellerId] = {
                        sellerId,
                        shopName: product.shopName,
                        price: totalPrice,
                        products: [{
                            id: item.id,
                            quantity: item.quantity,
                            productInfo: product
                        }]
                    };
                } else {
                    groupedBySeller[sellerId].price += totalPrice;
                    groupedBySeller[sellerId].products.push({
                        id: item.id,
                        quantity: item.quantity,
                        productInfo: product
                    });
                }
            }

            const sellerGroupedCart = Object.values(groupedBySeller);
            const shipping_fee = 125 + (85 * buy_product_item);
            const subtotal = calculatePrice + shipping_fee;
            const vat = Math.round(subtotal * 0.16);
            const total = subtotal + vat;

            return res.status(200).json({
                cart_products: sellerGroupedCart,
                price: calculatePrice,
                cart_product_count,
                buy_product_item,
                shipping_fee,
                subtotal,
                vat,
                total,
                outOfStockProduct
            });

        } catch (error) {
            console.error('Error in get_cart_products:', error.message);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    delete_cart_product = async (req, res) => {
        const { cart_id } = req.params;
        try {
            const deleted = await db.Cart.destroy({
                where: { id: cart_id }
            });

            if (deleted) {
                responseReturn(res, 200, { message: 'success' });
            } else {
                responseReturn(res, 404, { message: 'Cart product not found' });
            }
        } catch (error) {
            console.error(error.message);
            responseReturn(res, 500, { message: 'Internal server error' });
        }
    }

    quantity_inc = async (req, res) => {
        const { cart_id } = req.params;

        try {
            const product = await db.Cart.findByPk(cart_id);
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            product.quantity += 1;
            await product.save();

            responseReturn(res, 200, {
                message: '+1 success',
                product,
            });

        } catch (error) {
            console.log(error.message);
            return res.status(500).json({ error: 'Server Error' });
        }
    }

    quantity_dec = async (req, res) => {
        const { cart_id } = req.params;

        try {
            const product = await db.Cart.findByPk(cart_id);
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            if (product.quantity <= 1) {
                return res.status(400).json({ error: 'Quantity must have a value greater than 0' });
            }

            product.quantity -= 1;
            await product.save();

            responseReturn(res, 200, {
                message: '-1 success',
                product,
            });

        } catch (error) {
            console.log(error.message);
            return res.status(500).json({ error: 'Server Error' });
        }
    }

    add_wishlist = async (req, res) => {
        const { slug, userId, productId } = req.body;

        try {
            const existingProduct = await db.Wishlist.findOne({
                where: { slug, userId },
            });

            if (existingProduct) {
                return responseReturn(res, 400, { error: 'Product exists in wishlist' });
            }

            // ✅ Check if already in cart
            const cartProduct = await db.Cart.findOne({
                where: { productId, userId },
            });

            if (cartProduct) {
                return responseReturn(res, 400, { error: 'Product already in cart' });
            }

            const newWishlistItem = await db.Wishlist.create(req.body);

            responseReturn(res, 201, {
                message: 'Added to wishlist successfully',
                wishlistItem: newWishlistItem,
            });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ error: 'Server Error' });
        }
    }

    get_wishlist = async (req, res) => {
        const { userId } = req.params;

        try {
            const wishlists = await db.Wishlist.findAll({
                where: { userId }
            });

            responseReturn(res, 200, {
                wishlistCount: wishlists.length,
                wishlists,
            });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ error: 'Server Error' });
        }
    }

    delete_wishlist = async (req, res) => {
        const { wishlistId } = req.params;

        try {
            await db.Wishlist.destroy({
                where: { id: wishlistId }
            });

            responseReturn(res, 200, {
                message: 'success',
                wishlistId
            });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ error: 'Server Error' });
        }
    }

    get_cart_and_wishlist_counts = async (req, res) => {
        try {
            const { userId } = req.params;
            const { productId } = req.query;

            const cartCount = await db.Cart.count('quantity', { where: { userId } });
            const wishlistCount = await db.Wishlist.count({ where: { userId } });

            let isInCart = false;

            if (productId) {
                const existing = await db.Cart.findOne({ where: { userId, productId } });
                isInCart = !!existing;
            }

            return res.status(200).json({
                cart_product_count: cartCount,
                wishlist_count: wishlistCount,
                is_product_in_cart: isInCart,
                productId
            });
        } catch (error) {
            console.error('Error fetching cart/wishlist counts:', error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

}

export default new cartController();