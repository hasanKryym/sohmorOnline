import { FaRegUser } from "react-icons/fa";
import { FaCartShopping } from "react-icons/fa6";
import { FaHistory } from "react-icons/fa";
import { FaStar } from "react-icons/fa";

export const profileLinks = [
  {
    name: "My Account",
    link: "/profile",
    icon: <FaRegUser />,
  },

  {
    name: "Cart",
    link: "/cart",
    icon: <FaCartShopping />,
  },

  {
    name: "My Orders",
    link: "/profile/myOrders",
    icon: <FaHistory />,
  },

  {
    name: "Favorites",
    link: "/profile/favorites",
    icon: <FaStar />,
  },
];
