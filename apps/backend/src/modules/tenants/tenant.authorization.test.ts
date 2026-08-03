import { afterEach, describe, expect, it, vi } from "vitest";
import { MembershipModel } from "../../models/membership.model.js";
import { WorkspaceModel } from "../../models/workspace.model.js";
import { requireWorkspaceAccess } from "./tenant.authorization.js";

const workspaceId = "64b000000000000000000001";
const organisationId = "64b000000000000000000002";
const userId = "64b000000000000000000003";

afterEach(() => vi.restoreAllMocks());

describe("workspace tenant authorization", () => {
  it("binds membership lookup to the workspace organisation", async () => {
    vi.spyOn(WorkspaceModel, "findById").mockReturnValue({
      select: () => ({
        lean: async () => ({ _id: workspaceId, organisationId })
      })
    } as never);
    const membershipLookup = vi.spyOn(MembershipModel, "findOne").mockReturnValue({
      lean: async () => null
    } as never);

    await expect(requireWorkspaceAccess(userId, workspaceId)).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
    expect(membershipLookup).toHaveBeenCalledWith(
      expect.objectContaining({ userId, organisationId })
    );
  });
});
