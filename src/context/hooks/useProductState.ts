
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Product } from '../types';
import { getFromLocalStorage, saveToLocalStorage } from '../utils';
import { toast } from "sonner";

export const useProductState = (isAuthenticated: boolean, currentUser: any) => {
  const [products, setProducts] = useState<Product[]>([]);

  // Initialize state from localStorage after component mounts
  useEffect(() => {
    setProducts(getFromLocalStorage("products", []));
  }, []);

  // Persist state changes to localStorage
  useEffect(() => {
    saveToLocalStorage("products", products);
  }, [products]);

  // Load initial data from Supabase when authenticated
  useEffect(() => {
    const loadProductData = async () => {
      if (isAuthenticated && currentUser) {
        try {
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*');
          
          if (productsError) {
            console.error("Error loading products:", productsError);
          } else if (productsData) {
            const formattedProducts = productsData.map(p => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              price: p.price,
              supplierPrice: p.supplier_price,
              stock: p.stock,
              image: p.image
            }));
            setProducts(formattedProducts);
          }
        } catch (error) {
          console.error("Error in loadProductData:", error);
        }
      }
    };
    
    loadProductData();
  }, [isAuthenticated, currentUser]);

  const addProduct = async (product: Omit<Product, 'id'>): Promise<void> => {
    if (isAuthenticated) {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          sku: product.sku,
          price: product.price,
          supplier_price: product.supplierPrice,
          stock: product.stock,
          image: product.image
        })
        .select();
      
      if (error) {
        console.error("Error adding product:", error);
        toast.error(`Gagal menambahkan produk: ${error.message}`, {
          duration: 1000
        });
        return;
      }
      
      if (data && data[0]) {
        const newProduct = {
          id: data[0].id,
          name: data[0].name,
          sku: data[0].sku,
          price: data[0].price,
          supplierPrice: data[0].supplier_price,
          stock: data[0].stock,
          image: data[0].image
        };
        
        setProducts(prev => [...prev, newProduct]);
        toast.success(`Produk ditambahkan: ${product.name}`, {
          duration: 1000
        });
        return;
      }
    }
    
    const newProduct = {
      ...product,
      id: Date.now().toString(),
    };
    
    setProducts(prev => [...prev, newProduct]);
    toast.success(`Produk ditambahkan: ${product.name}`, {
      duration: 1000
    });
  };
  
  const updateProduct = async (product: Product): Promise<void> => {
    if (isAuthenticated) {
      const { data, error } = await supabase
        .from('products')
        .update({
          name: product.name,
          sku: product.sku,
          price: product.price,
          supplier_price: product.supplierPrice,
          stock: product.stock,
          image: product.image
        })
        .eq('id', product.id)
        .select();
      
      if (error) {
        console.error("Error updating product:", error);
        toast.error(`Gagal memperbarui produk: ${error.message}`, {
          duration: 1000
        });
        return;
      }
    }
    
    setProducts(prev => 
      prev.map(p => p.id === product.id ? product : p)
    );
    toast.success(`Produk diperbarui: ${product.name}`, {
      duration: 1000
    });
  };
  
  const deleteProduct = async (id: string): Promise<void> => {
    try {
      const { data: transactionItems, error: checkError } = await supabase
        .from('transaction_items')
        .select('id')
        .eq('product_id', id)
        .limit(1);
      
      if (checkError) {
        console.error("Error checking product usage:", checkError);
        toast.error(`Gagal memeriksa produk: ${checkError.message}`, {
          duration: 1000
        });
        return;
      }
      
      if (transactionItems && transactionItems.length > 0) {
        toast.error("Produk tidak dapat dihapus karena sudah digunakan dalam transaksi", {
          duration: 1000
        });
        return;
      }
      
      if (isAuthenticated) {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error("Error deleting product:", error);
          toast.error(`Gagal menghapus produk: ${error.message}`, {
            duration: 1000
          });
          return;
        }
      }
      
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success("Produk dihapus");
    } catch (error) {
      console.error("Error in deleteProduct:", error);
      toast.error("Gagal menghapus produk: Terjadi kesalahan", {
        duration: 1000
      });
    }
  };

  return {
    products,
    setProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  };
};
