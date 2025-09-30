import { sequelize } from "../config/db.js";
import AdminModel from "./admin.model.js";
import AuthOrderModel from "./authOrder.model.js";
import BlogModel from "./blog.model.js";
import BrandModel from "./brand.model.js";
import CarBrandModel from "./carBrand.model.js";
import CartModel from "./cart.model.js";
import CategoryModel from "./category.models.js";
import AdminSellerModel from "./chat/admin-seller-message.model.js";
import SellerCustomerMessageModel from "./chat/seller-customer-message.model.js";
import SellerCustomerModel from "./chat/seller-customer.model.js";
import ContactModel from "./contact.model.js";
import CustomerModel from "./customer.model.js";
import CustomerOrderModel from "./customerOrder.js";
import FAQModel from "./faq.model.js";
import FavoriteModel from "./favorite.model.js";
import LeadModel from "./leads.model.js";
import CarListingModel from "./listing.model.js";
import MakeModel from "./makes.model.js";
import NewsLetterModel from "./newsletter.model.js";
import PackageModel from "./package.model.js";
import AccountModel from "./payment/Accounts.model.js";
import BankModel from "./payment/banks.model.js";
import PaymentModel from "./payment/payment.model.js";
import PaystackModel from "./payment/paystack.model.js";
import SellerWalletModel from "./payment/sellerWallet.model.js";
import ShopWalletModel from "./payment/shopWallet.js";
import WithdrawalRequestModel from "./payment/withdrawalRequest.model.js";
import ProductModel from "./product.model.js";
import ReviewModel from "./review.model.js";
import SellerModel from "./seller.model.js";
import SubscriptionModel from "./subscription.model.js";
import TeamMemberModel from "./team.model.js";
import TransactionModel from "./transaction.model.js";
import WishlistModel from "./wishlist.model.js";

const db = {};

db.sequelize = sequelize;

// initializing models
db.Admin = AdminModel(sequelize);
db.Seller = SellerModel(sequelize);
db.SellerCustomer = SellerCustomerModel(sequelize);
db.Customer = CustomerModel(sequelize);
db.Banks = BankModel(sequelize);
db.Paystack = PaystackModel(sequelize);
db.Account = AccountModel(sequelize);
db.AdminSellerMessage = AdminSellerModel(sequelize);
db.SellerCustomerMessage = SellerCustomerMessageModel(sequelize);
db.Package = PackageModel(sequelize);
db.Transaction = TransactionModel(sequelize);
db.Subscriptions = SubscriptionModel(sequelize);
db.CarListing = CarListingModel(sequelize);
db.Leads = LeadModel(sequelize)
db.Category = CategoryModel(sequelize);
db.Brand = BrandModel(sequelize);
db.Product = ProductModel(sequelize);
db.Subscribers = NewsLetterModel(sequelize);
db.CustomerOrder = CustomerOrderModel(sequelize);
db.AuthOrder = AuthOrderModel(sequelize);
db.Payment = PaymentModel(sequelize);
db.ShopWallet = ShopWalletModel(sequelize);
db.SellerWallet = SellerWalletModel(sequelize);
db.WithdrawalRequest = WithdrawalRequestModel(sequelize)
db.Cart = CartModel(sequelize);
db.Wishlist = WishlistModel(sequelize);
db.Team = TeamMemberModel(sequelize);
db.Make = MakeModel(sequelize);
db.CarBrand = CarBrandModel(sequelize);
db.Reviews = ReviewModel(sequelize);
db.Blog = BlogModel(sequelize);
db.FAQ = FAQModel(sequelize);
db.Favorite = FavoriteModel(sequelize);
db.Contact = ContactModel(sequelize);

// Defining associations here
db.Seller.hasMany(db.CarListing, { foreignKey: 'sellerId', onDelete: 'CASCADE' });
db.CarListing.belongsTo(db.Seller, { foreignKey: 'sellerId', onDelete: 'CASCADE' });
db.Seller.hasMany(db.Product, { foreignKey: 'sellerId' });
db.Product.belongsTo(db.Seller, { foreignKey: 'sellerId' });
db.Category.hasMany(db.Brand, { foreignKey: 'categoryId', as: 'brands', onDelete: 'CASCADE' });
db.Brand.belongsTo(db.Category, { foreignKey: 'categoryId', as: 'category', onDelete: 'CASCADE' });
db.CustomerOrder.hasMany(db.AuthOrder, { foreignKey: 'orderId', as: 'suborder', onDelete: 'CASCADE' });
db.AuthOrder.belongsTo(db.CustomerOrder, { foreignKey: 'orderId', as: 'order', onDelete: 'CASCADE' });
db.AuthOrder.belongsTo(db.Seller, { as: 'seller', foreignKey: 'sellerId', onDelete: 'CASCADE' });
db.Payment.belongsTo(db.CustomerOrder, { foreignKey: 'orderId', targetKey: 'id', onDelete: 'CASCADE' });
db.CustomerOrder.hasOne(db.Payment, { foreignKey: 'orderId', sourceKey: 'id', onDelete: 'CASCADE' });
db.Cart.belongsTo(db.Product, { foreignKey: 'productId' });
db.Make.hasMany(db.CarBrand, { foreignKey: 'makeId', as: 'models', onDelete: 'CASCADE' });
db.CarBrand.belongsTo(db.Make, { foreignKey: 'makeId', as: 'make' });


export { db }