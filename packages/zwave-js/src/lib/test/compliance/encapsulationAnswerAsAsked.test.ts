import {
	BasicCCReport,
	CRC16CC,
	CRC16CCCommandEncapsulation,
	MultiChannelCC,
	MultiChannelCCCommandEncapsulation,
	SupervisionCC,
	SupervisionCCReport,
	ZWavePlusCCGet,
	ZWavePlusCCReport,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import {
	createMockZWaveRequestFrame,
	MockZWaveFrameType,
	MockZWaveRequestFrame,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import path from "path";
import { integrationTest } from "../integrationTestSuite";

integrationTest(
	"Responses to encapsulated requests use the same encapsulation (CRC-16)",
	{
		// debug: true,
		provisioningDirectory: path.join(__dirname, "fixtures/base_2_nodes"),

		nodeCapabilities: {
			commandClasses: [
				{
					ccId: CommandClasses["CRC-16 Encapsulation"],
					isSupported: true,
				},
				{
					ccId: CommandClasses["Z-Wave Plus Info"],
					isSupported: true,
					version: 2,
				},
			],
		},

		testBody: async (driver, node, mockController, mockNode) => {
			// We know that the driver must respond to Z-Wave Plus Info Get
			// so we can use that to test
			const zwpRequest = new ZWavePlusCCGet(mockController.host, {
				nodeId: mockNode.id,
			});
			const cc = CRC16CC.encapsulate(mockController.host, zwpRequest);
			await mockNode.sendToController(createMockZWaveRequestFrame(cc));

			const { payload: response } =
				await mockNode.expectControllerFrame<MockZWaveRequestFrame>(
					1000,
					(msg): msg is MockZWaveRequestFrame =>
						msg.type === MockZWaveFrameType.Request,
				);

			expect(response).toBeInstanceOf(CRC16CCCommandEncapsulation);
			expect(
				(response as CRC16CCCommandEncapsulation).encapsulated,
			).toBeInstanceOf(ZWavePlusCCReport);

			// Allow for everything to settle
			await wait(100);
		},
	},
);

integrationTest(
	"Responses to encapsulated requests use the same encapsulation (Multi Channel)",
	{
		// debug: true,
		provisioningDirectory: path.join(
			__dirname,
			"fixtures/encapsulationAnswerAsAsked",
		),

		nodeCapabilities: {
			commandClasses: [
				{
					ccId: CommandClasses["Multi Channel"],
					version: 4,
					isSupported: true,
				},
				{
					ccId: CommandClasses["Z-Wave Plus Info"],
					isSupported: true,
					version: 2,
				},
			],
		},

		testBody: async (driver, node, mockController, mockNode) => {
			// We know that the driver must respond to Z-Wave Plus Info Get
			// so we can use that to test
			const zwpRequest = new ZWavePlusCCGet(mockController.host, {
				nodeId: mockNode.id,
			});
			const cc = MultiChannelCC.encapsulate(
				mockController.host,
				zwpRequest,
			);
			(cc as MultiChannelCCCommandEncapsulation).endpointIndex = 2;

			await mockNode.sendToController(createMockZWaveRequestFrame(cc));

			const { payload: response } =
				await mockNode.expectControllerFrame<MockZWaveRequestFrame>(
					1000,
					(msg): msg is MockZWaveRequestFrame =>
						msg.type === MockZWaveFrameType.Request,
				);

			expect(response).toBeInstanceOf(MultiChannelCCCommandEncapsulation);
			const mcc = response as MultiChannelCCCommandEncapsulation;
			expect(mcc.destination).toBe(2);
			const inner = mcc.encapsulated;
			expect(inner).toBeInstanceOf(ZWavePlusCCReport);

			// Allow for everything to settle
			await wait(100);
		},
	},
);

integrationTest(
	"Responses to encapsulated requests use the same encapsulation (Supervision)",
	{
		// debug: true,
		provisioningDirectory: path.join(
			__dirname,
			"fixtures/encapsulationAnswerAsAsked",
		),

		nodeCapabilities: {
			commandClasses: [
				{
					ccId: CommandClasses.Supervision,
					version: 2,
					isSupported: true,
				},
				{
					ccId: CommandClasses["Z-Wave Plus Info"],
					isSupported: true,
					version: 2,
				},
			],
		},

		testBody: async (driver, node, mockController, mockNode) => {
			const basicReport = new BasicCCReport(mockController.host, {
				nodeId: mockNode.id,
				currentValue: 0,
			});
			const cc = SupervisionCC.encapsulate(
				mockController.host,
				basicReport,
			);

			await mockNode.sendToController(createMockZWaveRequestFrame(cc));

			const { payload: response } =
				await mockNode.expectControllerFrame<MockZWaveRequestFrame>(
					1000,
					(msg): msg is MockZWaveRequestFrame =>
						msg.type === MockZWaveFrameType.Request,
				);

			expect(response).toBeInstanceOf(SupervisionCCReport);

			// Allow for everything to settle
			await wait(100);
		},
	},
);

integrationTest(
	"Responses to encapsulated requests use the same encapsulation (Supervision + Multi Channel)",
	{
		// debug: true,
		provisioningDirectory: path.join(
			__dirname,
			"fixtures/encapsulationAnswerAsAsked",
		),

		nodeCapabilities: {
			commandClasses: [
				{
					ccId: CommandClasses["Multi Channel"],
					version: 4,
					isSupported: true,
				},
				{
					ccId: CommandClasses.Supervision,
					version: 2,
					isSupported: true,
				},
				{
					ccId: CommandClasses["Z-Wave Plus Info"],
					isSupported: true,
					version: 2,
				},
			],
		},

		testBody: async (driver, node, mockController, mockNode) => {
			const basicReport = new BasicCCReport(mockController.host, {
				nodeId: mockNode.id,
				currentValue: 0,
			});
			const supervised = SupervisionCC.encapsulate(
				mockController.host,
				basicReport,
			);
			const cc = MultiChannelCC.encapsulate(
				mockController.host,
				supervised,
			);
			(cc as MultiChannelCCCommandEncapsulation).endpointIndex = 2;

			await mockNode.sendToController(createMockZWaveRequestFrame(cc));

			const { payload: response } =
				await mockNode.expectControllerFrame<MockZWaveRequestFrame>(
					1000,
					(msg): msg is MockZWaveRequestFrame =>
						msg.type === MockZWaveFrameType.Request,
				);

			expect(response).toBeInstanceOf(MultiChannelCCCommandEncapsulation);
			const mcc = response as MultiChannelCCCommandEncapsulation;
			expect(mcc.destination).toBe(2);
			const inner = mcc.encapsulated;
			expect(inner).toBeInstanceOf(SupervisionCCReport);

			// Allow for everything to settle
			await wait(100);
		},
	},
);
