import mysql, { RowDataPacket, ResultSetHeader } from "mysql2/promise";

const dbConfig = {
  host: process.env.DB_HOST || "192.168.1.10",
  user: process.env.DB_USER || "george",
  password: process.env.DB_PASSWORD || "&355ewxxKE",
  database: process.env.DB_NAME || "chak_dosimetry",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

// ✅ Get pool if needed elsewhere
export const getDB = () => pool;

// ✅ Table definitions
const createDosimeters = `
  CREATE TABLE IF NOT EXISTS dosimeters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serial_number VARCHAR(255) UNIQUE NOT NULL,
    model VARCHAR(100) NULL,
    type VARCHAR(100) NULL,
    status ENUM('available','dispatched','in_transit','received','retired','expired','lost') DEFAULT 'available',
    dispatched_at TIMESTAMP NULL,
    received_at TIMESTAMP NULL,
    hospital_name VARCHAR(255),
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    leasing_period VARCHAR(100) NULL,
    calibration_date DATE NULL,
    expiry_date DATE NULL,
    received_by VARCHAR(255),
    receiver_title VARCHAR(255),
    comment TEXT NULL,

    -- ✅ Condition checkboxes
    dosimeter_device BOOLEAN DEFAULT FALSE,
    dosimeter_case BOOLEAN DEFAULT FALSE,
    pin_holder BOOLEAN DEFAULT FALSE,
    strap_clip BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`;

const createShipments = `
  CREATE TABLE IF NOT EXISTS shipments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    destination VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    courier_name VARCHAR(255),
    courier_staff VARCHAR(255),
    dispatched_by VARCHAR(255),
    status ENUM('dispatched','in_transit','delivered') DEFAULT 'dispatched',
    dispatched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_delivery DATE,
    leasing_period VARCHAR(100) NULL,
    expiry_date DATE NULL,
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- ✅ Condition checkboxes
    dosimeter_device BOOLEAN DEFAULT FALSE,
    dosimeter_case BOOLEAN DEFAULT FALSE,
    pin_holder BOOLEAN DEFAULT FALSE,
    strap_clip BOOLEAN DEFAULT FALSE
  )
`;

const createShipmentDosimeters = `
  CREATE TABLE IF NOT EXISTS shipment_dosimeters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shipment_id INT,
    dosimeter_id INT,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    FOREIGN KEY (dosimeter_id) REFERENCES dosimeters(id) ON DELETE CASCADE
  )
`;

const createNotifications = `
  CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`;

const createRequests = `
  CREATE TABLE IF NOT EXISTS requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospital VARCHAR(255) NOT NULL,
    requested_by VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    document VARCHAR(255) NULL, -- ✅ store file path
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

const createInventory = `
  CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL, -- e.g., 'Dosimeter'
    total_quantity INT NOT NULL DEFAULT 0,
    available_quantity INT NOT NULL DEFAULT 0,
    assigned_quantity INT NOT NULL DEFAULT 0,
    expiring_30_days INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`;

const createHolders = `
  CREATE TABLE IF NOT EXISTS holders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

const createAllocations = `
  CREATE TABLE IF NOT EXISTS allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    facility_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    allocation_type ENUM('previous','FY25','expired','other') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

const createDosimeterHistory = `
  CREATE TABLE IF NOT EXISTS dosimeter_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dosimeter_id INT NOT NULL,
    action VARCHAR(100) NOT NULL, -- e.g. added, updated, retired, assigned, recalled
    hospital_name VARCHAR(255) NULL,
    actor VARCHAR(255) DEFAULT 'system',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dosimeter_id) REFERENCES dosimeters(id) ON DELETE CASCADE
  )
`;

const createContracts = `
  CREATE TABLE IF NOT EXISTS contracts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    facility_name VARCHAR(255) NOT NULL,
    dosimeters INT NOT NULL DEFAULT 0,
    spectacles INT DEFAULT 0,
    face_masks INT DEFAULT 0,
    medicines INT DEFAULT 0,
    machines INT DEFAULT 0,
    accessories INT DEFAULT 0,
    item_type VARCHAR(50) DEFAULT 'all',
    start_date DATE NULL,
    end_date DATE NULL,
    status ENUM('active','expired','terminated','pending') DEFAULT 'active',
    notes TEXT NULL,
    contact_person VARCHAR(255) NULL,
    contact_phone VARCHAR(50) NULL,
    contact_email VARCHAR(255) NULL,
    facility_type VARCHAR(100) NULL,
    priority ENUM('low','medium','high') DEFAULT 'medium',
    contract_value DECIMAL(12,2) DEFAULT 0,
    renewal_reminder BOOLEAN DEFAULT FALSE,
    scanned_document VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`;

const createContractAccessories = `
  CREATE TABLE IF NOT EXISTS contract_accessories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

const createContractSummary = `
  CREATE TABLE IF NOT EXISTS contract_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_dosimeters INT NOT NULL DEFAULT 0,
    active_dosimeters INT NOT NULL DEFAULT 0,
    remaining_dosimeters INT NOT NULL DEFAULT 0,
    expired_uncollected INT NOT NULL DEFAULT 0,
    replaced_dosimeters INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`;

const createExpiredContracts = `
  CREATE TABLE IF NOT EXISTS expired_contracts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    facility_name VARCHAR(255) NOT NULL,
    dosimeters INT NOT NULL DEFAULT 0,
    expired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    collected BOOLEAN DEFAULT FALSE,
    notes TEXT NULL
  )
`;

const createHospitals = `
  CREATE TABLE IF NOT EXISTS hospitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(191) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  )
`;

const createUsers = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    passwordHash VARCHAR(191) NOT NULL,
    role ENUM('ADMIN', 'HOSPITAL') NOT NULL DEFAULT 'HOSPITAL',
    resetRequired BOOLEAN NOT NULL DEFAULT FALSE,
    hospitalId INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospitalId) REFERENCES hospitals(id) ON DELETE SET NULL ON UPDATE CASCADE
  )
`;

// Unified items table for all inventory categories
const createItems = `
  CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL DEFAULT 'dosimeter',
    serial_number VARCHAR(255) UNIQUE,
    sku VARCHAR(100),
    name VARCHAR(255),
    model VARCHAR(100),
    type VARCHAR(100),
    description TEXT,
    status ENUM('available', 'dispatched', 'in_transit', 'received', 'retired', 'expired', 'lost', 'returned') DEFAULT 'available',
    quantity INT DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'pcs',
    location VARCHAR(255),
    hospital_name VARCHAR(255),
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    leasing_period VARCHAR(100),
    calibration_date DATE,
    expiry_date DATE,
    warranty_until DATE,
    is_consumable BOOLEAN DEFAULT FALSE,
    batch_number VARCHAR(100),
    comment TEXT,
    dispatched_at TIMESTAMP NULL,
    received_at TIMESTAMP NULL,
    received_by VARCHAR(255),
    receiver_title VARCHAR(255),
    -- Condition checkboxes (for dosimeters and accessories)
    dosimeter_device BOOLEAN DEFAULT FALSE,
    dosimeter_case BOOLEAN DEFAULT FALSE,
    pin_holder BOOLEAN DEFAULT FALSE,
    strap_clip BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_serial (serial_number),
    INDEX idx_sku (sku)
  )
`;

// Unified history table for all item types
const createItemHistory = `
  CREATE TABLE IF NOT EXISTS item_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'dosimeter',
    action VARCHAR(100) NOT NULL,
    hospital_name VARCHAR(255) NULL,
    actor VARCHAR(255) DEFAULT 'system',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_item (item_id),
    INDEX idx_category (category),
    INDEX idx_created (created_at)
  )
`;

// System settings table for dynamic categories
const createSystemSettings = `
  CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`;


// ✅ Initialize DB
export const initDatabase = async (): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    await connection.query(createDosimeters);
    await connection.query(createShipments);
    await connection.query(createShipmentDosimeters);
    await connection.query(createNotifications);
    await connection.query(createRequests);
    await connection.query(createInventory);
    await connection.query(createHolders);
    await connection.query(createAllocations);
    await connection.query(createDosimeterHistory);
    await connection.query(createContracts);
    await connection.query(createContractAccessories);
    await connection.query(createContractSummary);
    await connection.query(createExpiredContracts);
    await connection.query(createHospitals);
    await connection.query(createUsers);
    await connection.query(createItems);
    await connection.query(createItemHistory);
    await connection.query(createSystemSettings);

    // Insert default categories if not exists
    await connection.query(`
      INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES 
      ('inventory_categories', '["dosimeter", "spectacles", "face_mask", "medicine", "machine", "accessory"]')
    `);

    console.log("✅ Database tables initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  } finally {
    connection.release();
  }
};

// ✅ Generic query helper
export const query = async <
  T extends RowDataPacket[] | ResultSetHeader = RowDataPacket[]
>(
  sql: string,
  params: any[] = []
): Promise<T> => {
  try {
    const [results] = await pool.execute<T>(sql, params);
    return results;
  } catch (error) {
    console.error("❌ Database query error:", error);
    throw error;
  }
};

export default pool;
