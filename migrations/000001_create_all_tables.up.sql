-- CreateEnum
CREATE TYPE "Role" AS ENUM ('collector', 'admin');
CREATE TYPE "Status" AS ENUM ('active', 'completed');
CREATE TYPE "PaymentMode" AS ENUM ('cash', 'online');

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(10) UNIQUE NOT NULL CHECK (phone ~ '^[0-9]{10}$'),
    password_hash VARCHAR(255) NOT NULL,
    role "Role" NOT NULL DEFAULT 'collector', -- 'admin' or 'collector'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Clubs Table
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    status "Status" NOT NULL DEFAULT 'active', -- 'active' or 'completed'
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Club-Users Junction Table (Many-to-Many)
CREATE TABLE clubs_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensures a user can't be added to the same club twice
    CONSTRAINT unique_club_user UNIQUE (club_id, user_id)
);

-- 4. Collections Table
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE RESTRICT,
    collector_id UUID REFERENCES users(id) ON DELETE SET NULL,
    donor_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(10) CHECK (phone_number ~ '^[0-9]{10}$'),
    amount NUMERIC(10, 2) NOT NULL,
    payment_mode "PaymentMode" NOT NULL DEFAULT 'cash', -- 'cash' or 'online'
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Expenses Table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE RESTRICT,
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE
);
