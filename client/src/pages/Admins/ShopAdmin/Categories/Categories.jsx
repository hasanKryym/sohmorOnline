import { useEffect, useState } from "react";
import "./Categories.css";
import Navbar from "../../Navbar/Navbar";
import { useCategories } from "../../../../context/Shop/Categories/CategoriesContext";
import { useUser } from "../../../../context/User/UserContext";

const Categories = () => {
  const { categories, getCategories, addNewCategory } = useCategories();
  const { user } = useUser();

  const [newCategory, setNewCategory] = useState("");

  const handleChange = (event) => {
    setNewCategory(event.target.value);
  };

  useEffect(() => {
    getCategories(user.data.role.shop);
  }, []);

  const addShopCategory = async (e) => {
    e.preventDefault();
    if (!newCategory) return;
    const response = await addNewCategory(newCategory);
    if (response.success) setNewCategory("");
  };
  return (
    <>
      <Navbar />
      <div>
        <form onSubmit={addShopCategory}>
          <input
            type="text"
            className="custom-input"
            style={{ width: "350px", marginRight: "1rem" }}
            value={newCategory}
            onChange={handleChange}
            placeholder="Enter new category..."
          />
          <button type="submit" className="custom-button">
            Add
          </button>
        </form>
      </div>
      <div className="">
        {categories.map((category, i) => {
          return <h3 key={i}>{category.name} </h3>;
        })}
      </div>
    </>
  );
};

export default Categories;
