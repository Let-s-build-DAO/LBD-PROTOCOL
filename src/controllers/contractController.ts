import { Request, Response, NextFunction } from "express";
import { Contract } from "../models/Contract";

export const addContract = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, address, chain, label } = req.body;
        const contract = await Contract.create({ userId, address, chain, label });
        res.status(201).json({ success: true, contract });
    } catch (error) {
        next(error);
    }
};

export const getUserContracts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
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
