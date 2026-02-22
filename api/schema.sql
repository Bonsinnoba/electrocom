-- Database schema for Essentialshub
-- Tables will be created in the currently selected database ('local')


-- Create Users table with enhanced profile fields
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role ENUM('customer', 'admin') DEFAULT 'customer',
    level INT DEFAULT 1,
    level_name VARCHAR(50) DEFAULT 'Starter',
    avatar_text VARCHAR(10) DEFAULT 'U',
    profile_image LONGTEXT, -- To store Base64 images for now
    wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Products table with categorization and color support
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    image_url VARCHAR(255),
    stock_quantity INT DEFAULT 0,
    colors JSON, -- Store array of color names/hex codes
    specs JSON, -- Store specification key-value pairs
    included JSON, -- Store items included in the box
    directions TEXT,
    rating DECIMAL(2, 1) DEFAULT 0.0,
    gallery JSON,
    product_code VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    shipping_address TEXT,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100), -- Paystack/Stripe reference
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    quantity INT NOT NULL,
    price_at_purchase DECIMAL(10, 2) NOT NULL,
    selected_color VARCHAR(50),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Create Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('order', 'promo', 'security', 'info') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Wallet & Transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type ENUM('credit', 'debit') NOT NULL,
    reference VARCHAR(100), -- Payment gateway reference
    title VARCHAR(255),
    details TEXT,
    status ENUM('completed', 'pending', 'failed') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed enhanced initial products
INSERT INTO products (name, description, price, category, image_url, stock_quantity, colors, specs, included, rating) VALUES
('Premium Wireless Headphones', 'Professional grade noise cancelling wireless headphones with 40h battery life.', 299.99, 'Optics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 50, '["Black", "Silver", "Midnight"]', '{"Driver": "40mm", "Bluetooth": "5.2", "Battery": "Up to 40h"}', '["Travel Case", "USB-C Cable", "Headphones"]', 4.8),
('Smart Watch Ultra', 'Rugged outdoor smartwatch with 100m water resistance and GPS.', 799.00, 'Semiconductors', 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800', 25, '["Orange", "White", "Grey"]', '{"Screen": "Retina OLED", "Waterproof": "100m", "Material": "Titanium"}', '["Alpine Loop", "Magnetic Charger", "Watch"]', 4.9),
('NextGen Gaming Mouse', 'Ultralight wireless gaming mouse with 25k DPI sensor.', 149.50, 'Electromechanical', 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=800', 75, '["Black", "White"]', '{"DPI": "25000", "Weight": "63g", "Switches": "Optical"}', '["USB Receiver", "USB-C Cable", "Mouse"]', 4.5),
('Studio Condenser Mic', 'High-quality USB microphone for streaming and podcasting.', 189.00, 'Optics', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800', 40, '["Matte Black", "Rose Gold"]', '{"Pattern": "Cardioid", "Connection": "USB-C", "Bit Depth": "24-bit"}', '["Pop Filter", "Shock Mount", "Desktop Stand"]', 4.7),
('Ergonomic Mechanical Keyboard', 'Split layout mechanical keyboard with hot-swappable switches.', 245.00, 'Electromechanical', 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800', 30, '["Grey", "Beige"]', '{"Switches": "MX Brown", "Layout": "TKL", "Connectivity": "Wired/Wireless"}', '["Keycap Puller", "Braided Cable", "Extra Switches"]', 4.6);

-- Create Slider Images table
CREATE TABLE IF NOT EXISTS slider_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_url LONGTEXT NOT NULL,
    title VARCHAR(255),
    subtitle VARCHAR(255),
    button_text VARCHAR(50),
    button_link VARCHAR(255),
    text_position VARCHAR(20) DEFAULT 'left',
    content_blocks LONGTEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial slider images
INSERT INTO slider_images (image_url, title, subtitle, button_text, button_link, display_order) VALUES
('https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600&h=600&auto=format&fit=crop', 'Next Gen Electronics', 'Experience the future of technology today.', 'Shop Now', '/shop', 1),
('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&h=600&auto=format&fit=crop', 'Premium Accessories', 'Elevate your daily carry with our curated collection.', 'Explore', '/shop', 2),
('https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=1600&h=600&auto=format&fit=crop', 'Smart Home Setup', 'Automate your life with smart home essentials.', 'View Collection', '/shop', 3);
