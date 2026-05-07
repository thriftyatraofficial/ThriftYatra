import { AiOutlineDashboard } from "react-icons/ai";
import { BiCategory, BiStore } from "react-icons/bi";
import { IoShirtOutline } from "react-icons/io5";
import { MdOutlineShoppingBag, MdOutlineLocalShipping } from "react-icons/md";
import { LuUserRound } from "react-icons/lu";
import { IoMdStarOutline } from "react-icons/io";

import { RiCoupon2Line } from "react-icons/ri";
import { Percent, Wallet, ImageIcon, Settings, FileText } from "lucide-react";
import { 
    ADMIN_CATEGORY_ADD, 
    ADMIN_CATEGORY_SHOW, 
   
    
    ADMIN_CUSTOMERS_SHOW, 
    ADMIN_DASHBOARD, 
    ADMIN_DELIVERY_SHOW,
     
    ADMIN_ORDER_SHOW, 
    ADMIN_PRODUCT_ADD, 
    ADMIN_PRODUCT_SHOW, 
    ADMIN_PRODUCT_VARIANT_ADD, 
    ADMIN_PRODUCT_VARIANT_SHOW, 
   
    ADMIN_SELLERS_SHOW,
    ADMIN_SELLERS_PENDING,
    ADMIN_THRIFT_SELLERS,
    ADMIN_BRAND_SELLERS,
    ADMIN_COMMISSION,
    ADMIN_PAYOUTS,
    ADMIN_BANNERS
} from "@/routes/AdminPanelRoute";

export const adminAppSidebarMenu = [
    {
        title: "Dashboard",
        url: ADMIN_DASHBOARD,
        icon: AiOutlineDashboard
    },
    {
        title: "Banners",
        url: ADMIN_BANNERS,
        icon: ImageIcon
    },
    {
        title: "Sellers",
        url: "#",
        icon: BiStore,
        submenu: [
            { title: "All Sellers", url: ADMIN_SELLERS_SHOW },
            { title: "Pending Approval", url: ADMIN_SELLERS_PENDING },
            { title: "Thrift Sellers", url: ADMIN_THRIFT_SELLERS },
            { title: "Brand Sellers", url: ADMIN_BRAND_SELLERS }
        ]
    },
    {
        title: "Category",
        url: "#",
        icon: BiCategory,
        submenu: [
            { title: "Add Category", url: ADMIN_CATEGORY_ADD },
            { title: "All Category", url: ADMIN_CATEGORY_SHOW }
        ]
    },
    {
        title: "Products",
        url: "#",
        icon: IoShirtOutline,
        submenu: [
            { title: "Add Product", url: ADMIN_PRODUCT_ADD },
            { title: "Add Variant", url: ADMIN_PRODUCT_VARIANT_ADD },
            { title: "All Products", url: ADMIN_PRODUCT_SHOW },
            { title: "Product Variants", url: ADMIN_PRODUCT_VARIANT_SHOW }
        ]
    },
   
    {
        title: "Orders",
        url: ADMIN_ORDER_SHOW,
        icon: MdOutlineShoppingBag
    },
    {
        title: "Delivery",
        url: ADMIN_DELIVERY_SHOW,
        icon: MdOutlineLocalShipping
    },
    {
        title: "Customers",
        url: ADMIN_CUSTOMERS_SHOW,
        icon: LuUserRound
    },
    
   
    {
        title: "Commission",
        url: ADMIN_COMMISSION,
        icon: Percent
    },
    {
        title: "Payouts",
        url: ADMIN_PAYOUTS,
        icon: Wallet
    },
    {
        title: "Content Pages",
        url: "/admin/content",
        icon: FileText
    },
    {
        title: "Settings",
        url: "/admin/settings",
        icon: Settings
    }
]