import { afterEach, describe, expect, it, vi } from "vitest";
import { MembershipModel } from "../../models/membership.model.js";
import { WorkspaceModel } from "../../models/workspace.model.js";
import { requireOrganisationAccess, requireWorkspaceAccess } from "./tenant.authorization.js";

const workspaceId = "64b000000000000000000001";
const organisationId = "64b000000000000000000002";
const userId = "64b000000000000000000003";

afterEach(() => vi.restoreAllMocks());

describe("workspace tenant authorization", () => {
  it("rejects malformed tenant identifiers before querying", async () => {
    await expect(requireWorkspaceAccess(userId, "invalid")).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
    await expect(requireOrganisationAccess(userId, "invalid")).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
  });

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

  it("returns a permission-authorized workspace context", async () => {
    vi.spyOn(WorkspaceModel, "findById").mockReturnValue({
      select: () => ({ lean: async () => ({ organisationId }) })
    } as never);
    vi.spyOn(MembershipModel, "findOne").mockReturnValue({
      lean: async () => ({ organisationId, workspaceIds: [workspaceId], role: "owner" })
    } as never);

    await expect(requireWorkspaceAccess(userId, workspaceId, "incident:assign")).resolves.toEqual({
      userId,
      organisationId,
      workspaceId,
      role: "owner",
      workspaceIds: [workspaceId]
    });
  });

  it("rejects workspace permissions that the membership does not have", async () => {
    vi.spyOn(WorkspaceModel, "findById").mockReturnValue({
      select: () => ({ lean: async () => ({ organisationId }) })
    } as never);
    vi.spyOn(MembershipModel, "findOne").mockReturnValue({
      lean: async () => ({ organisationId, workspaceIds: [workspaceId], role: "viewer" })
    } as never);

    await expect(
      requireWorkspaceAccess(userId, workspaceId, "incident:assign")
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("organisation tenant authorization", () => {
  it("returns an authorized organisation membership", async () => {
    vi.spyOn(MembershipModel, "findOne").mockReturnValue({
      lean: async () => ({ organisationId, workspaceIds: [workspaceId], role: "owner" })
    } as never);

    await expect(
      requireOrganisationAccess(userId, organisationId, "organisation:update")
    ).resolves.toMatchObject({ role: "owner", workspaceIds: [workspaceId] });
  });

  it("hides missing memberships and rejects unavailable permissions", async () => {
    vi.spyOn(MembershipModel, "findOne")
      .mockReturnValueOnce({ lean: async () => null } as never)
      .mockReturnValueOnce({
        lean: async () => ({ organisationId, workspaceIds: [], role: "viewer" })
      } as never);

    await expect(requireOrganisationAccess(userId, organisationId)).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
    await expect(
      requireOrganisationAccess(userId, organisationId, "organisation:update")
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
