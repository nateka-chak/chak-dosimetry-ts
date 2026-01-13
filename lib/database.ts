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
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    start_date DATE NULL,
    end_date DATE NULL,
    status ENUM('active','expired','terminated') DEFAULT 'active',
    notes TEXT NULL,
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
