import { Request, Response, NextFunction } from "express";
import { Contract } from "../models/Contract";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

// 🧠 Add a contract for the logged-in user
export const addContract = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const { address, chain } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const contract = await Contract.create({ userId, address, chain });
        res.status(201).json({ success: true, contract });
    } catch (error) {
        next(error);
    }
};

// 🧠 Get all contracts for the logged-in user
export const getUserContracts = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const contracts = await Contract.find({ userId });
        res.json({ success: true, contracts });
    } catch (error) {
        next(error);
    }
};


export const toggleContractStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const contract = await Contract.findById(id);
        if (!contract) return res.status(404).json({ message: "Contract not found" });

        contract.status = contract.status === "active" ? "inactive" : "active";
        await contract.save();

        res.json({ success: true, contract });
    } catch (error) {
        next(error);
    }
};
