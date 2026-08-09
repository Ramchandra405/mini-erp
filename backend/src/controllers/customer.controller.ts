import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendCreated, sendSuccess } from "../utils/ApiResponse";
import { customerService } from "../services/customer.service";

export const customerController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await customerService.list(req.query as any);
    sendSuccess(res, result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.getById(req.params.id);
    sendSuccess(res, customer);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body;
    const customer = await customerService.create({
      customerName: body.customerName,
      mobileNumber: body.mobileNumber,
      email: body.email || undefined,
      businessName: body.businessName || undefined,
      gstNumber: body.gstNumber || undefined,
      customerType: body.customerType,
      address: body.address || undefined,
      status: body.status || undefined,
      followUpDate: body.followUpDate ? new Date(body.followUpDate) : undefined,
      notes: body.notes || undefined,
    });
    sendCreated(res, customer);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body;
    const customer = await customerService.update(req.params.id, {
      ...(body.customerName !== undefined ? { customerName: body.customerName } : {}),
      ...(body.mobileNumber !== undefined ? { mobileNumber: body.mobileNumber } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(body.businessName !== undefined ? { businessName: body.businessName } : {}),
      ...(body.gstNumber !== undefined ? { gstNumber: body.gstNumber } : {}),
      ...(body.customerType !== undefined ? { customerType: body.customerType } : {}),
      ...(body.address !== undefined ? { address: body.address } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.followUpDate !== undefined ? { followUpDate: new Date(body.followUpDate) } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    });
    sendSuccess(res, customer);
  }),

  deactivate: asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.deactivate(req.params.id);
    sendSuccess(res, customer);
  }),
};
