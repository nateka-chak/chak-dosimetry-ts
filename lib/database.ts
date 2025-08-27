import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'george',
  password: process.env.DB_PASSWORD || '&355ewxxKE',
  database: process.env.DB_NAME || 'chak_dosimetry',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

// Table definitions
const createdosimeters = `
  CREATE TABLE IF NOT EXISTS dosimeters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serial_number VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('dispatched', 'in_transit', 'received') DEFAULT 'dispatched',
    dispatched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_at TIMESTAMP NULL,
    hospital_name VARCHAR(255),
    received_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`;

const createShipments = `
  CREATE TABLE IF NOT EXISTS shipments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    destination VARCHAR(255) NOT NULL,
    dispatched_by VARCHAR(255),
    status ENUM('dispatched', 'in_transit', 'delivered') DEFAULT 'dispatched',
    dispatched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_delivery DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

const createShipmentdosimeters = `
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

// Initialize DB
export const initDatabase = async (): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    await connection.query(createdosimeters);
    await connection.query(createShipments);
    await connection.query(createShipmentdosimeters);
    await connection.query(createNotifications);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Query helper
export const query = async (sql: string, params: any[] = []): Promise<any> => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export default pool;
